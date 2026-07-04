# Logging and Error Handling Rules (evlog)

> Read this before creating API routes, server actions, or handling errors.

---

## Core principle

All logging and error creation goes through `@/lib/evlog`. This is the single point of change: if you swap the drain or the logging library, only this file changes. Everything else in the app imports from `@/lib/evlog`.

The module exports `withEvlog`, `useLogger`, `log`, `createError`, and `tryUseLogger`, and is configured with `service: "app"`. In development it writes structured logs to `.evlog/logs/` via an fs drain. In production the drain is left undefined, which is the single swap point for any other sink (HTTP, a third-party service).

---

## 1. API route pattern

Every API route handler MUST be wrapped with `withEvlog()`.

Rule: `bedrock/route-handler-must-use-logger`.

`withEvlog` handles the request lifecycle logging, catches thrown errors, and emits one wide event per request.

```ts
import { withEvlog, useLogger, createError } from "@/lib/evlog";

export const GET = withEvlog(async (req: Request) => {
  const log = useLogger();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    throw createError({
      status: 400,
      message: "Missing id.",
      why: "Query parameter 'id' was not provided.",
      fix: "Call this endpoint with ?id=<value>.",
    });
  }

  log.set({ id });
  const item = await loadItem(id);
  log.set({ found: Boolean(item) });

  return Response.json({ data: item });
});

export const POST = withEvlog(async (req: Request) => {
  const log = useLogger();
  const body = await req.json();

  log.set({ action: "create", size: body.items?.length ?? 0 });
  const result = await create(body);

  return Response.json({ data: result });
});
```

`useLogger()` returns the logger bound to the current request. Use `log.set({...})` to attach context (see section 5).

---

## 2. Error creation

NEVER use `throw new Error(...)` in server code: route handlers, server actions, or any `"use server"` module.

Rule: `bedrock/no-throw-new-error-in-server`.

ALWAYS use `createError()`:

```ts
import { createError } from "@/lib/evlog";

throw createError({
  status: 404,
  message: "Item not found.",
  why: "No row matched the requested id in the primary store.",
  fix: "Verify the id exists, or create the item first.",
});
```

Fields:

- `status`: HTTP status code for the response.
- `message`: user-facing text, safe to display to the end user.
- `why`: the technical reason, for developer and AI debugging.
- `fix`: an actionable suggestion for resolving the failure.

Keep `message` free of internal detail; put the internals in `why`.

---

## 3. No raw console statements

ESLint restricts console usage to `console.warn` and `console.error` via `no-console`. Go further: prefer the structured logger.

- Server and client code: use `log.info()`, `log.warn()`, `log.error()` from `@/lib/evlog`.
- Reserve bare `console.warn` / `console.error` for the few places that run before the logger is initialized.

---

## 4. Log levels

| Level   | When |
|---------|------|
| `error` | Unexpected failures: unhandled exceptions, downstream service errors, data-store failures. |
| `warn`  | Degraded but recovered: a retry that eventually succeeded, a cache miss, a decode that fell back to a default. |
| `info`  | Significant business events: a resource created, a job completed, a session started. |
| `debug` | Development-only detail: request payloads, intermediate state. |

---

## 5. Wide event context

Use `log.set()` to accumulate context throughout a request. Every field set during the request is merged into a single structured log line, so one request produces one wide event rather than many scattered lines.

```ts
const log = useLogger();
log.set({ userId: session.userId });
log.set({ request: { action: "update", target: "settings" } });
log.set({ result: { changed: true, count: 3 } });
```

This produces one NDJSON line under `.evlog/logs/` with all context merged.

---

## 6. Logging outside a request

`useLogger()` throws when called outside a `withEvlog()` request context (for example inside a unit test or a shared helper that also runs off the request path). For code that must work in both contexts, use `tryUseLogger()`, which falls back to a no-op logger:

```ts
import { tryUseLogger } from "@/lib/evlog";

function doWork() {
  const log = tryUseLogger();
  log.set({ step: "work" });
  // ... runs whether or not there is an active request context
}
```

---

## 7. Reading logs

- Structured server logs (dev): `.evlog/logs/` as NDJSON, one wide event per request.
- Filter for failures with your search tool, for example grep `"error"` across the files in `.evlog/logs/`.
- The fs drain is dev-only. In production, swap the drain in `@/lib/evlog` for your chosen sink; no call site changes.
