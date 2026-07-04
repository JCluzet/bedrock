# Bedrock: Rendering and Caching Reference (Next.js 16)

> Read this before configuring rendering or caching for a route, page, or function.
> For strategy selection (which mode to reach for), see the component altitude guidance in `components.md`.

---

## Strategies overview

```
STATIC (SSG) ──── build time, CDN, same response for everyone
ISR          ──── build time + periodic background revalidation
PPR          ──── static shell delivered immediately + dynamic holes streamed in
SSR DYNAMIC  ──── rendered on every request, can read cookies/headers
CLIENT       ──── rendered in the browser, interactive
```

---

## 0. Server Components by default

Every component in the App Router is a React Server Component (RSC) unless you say otherwise. RSCs run only on the server: they can await data directly, they ship zero JavaScript to the browser, and they keep secrets server-side.

Reach for a client component (`"use client"` at the top of the file) only when a component needs one of:

- interactivity or event handlers (`onClick`, `onChange`, form control)
- state or effects (`useState`, `useReducer`, `useEffect`)
- browser-only APIs (`window`, `localStorage`, `IntersectionObserver`)
- a hook from `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`)

Rules for client boundaries:

- Keep the boundary small and push it to the leaves. A `"use client"` file makes its whole import subtree client code, so wrap only the interactive part, not the page.
- A Server Component can render a Client Component and pass it server-fetched data as props. A Client Component cannot import a Server Component, but it can accept one through `children`.
- Do the data fetching in a Server Component parent, then hand the result to a small client leaf for interaction.

```tsx
// Server Component: fetches, then delegates interaction to a small client leaf
export default async function Page() {
  const items = await getItems();
  return (
    <section>
      <ItemList items={items} />   {/* RSC: static markup */}
      <FilterBar />                {/* "use client": interactive leaf */}
    </section>
  );
}
```

---

## 1. Static (SSG) by default

No configuration needed if the component:

- does not call `cookies()`, `headers()`, or read `searchParams`
- does not use `fetch` with `cache: 'no-store'`

```tsx
// page.tsx: nothing to add, this is the default
export default async function Page() {
  const data = await fetch('https://api.example.com/public');
  return <div>{/* ... */}</div>;
}
```

To enforce static mode and catch accidental dynamic usage at build time:

```ts
export const dynamic = 'error'; // throws if any dynamic API is used
```

---

## 2. ISR: periodic revalidation

```ts
// At segment level (page.tsx or layout.tsx)
export const revalidate = 3600; // revalidate every hour

// Or per individual fetch
const data = await fetch('https://api.example.com/items', {
  next: { revalidate: 3600 },
});
```

### On-demand revalidation

```ts
// Inside a Server Action or Route Handler
import { revalidateTag, revalidatePath } from 'next/cache';

revalidateTag('items');    // invalidate by tag
revalidatePath('/catalog'); // invalidate an entire route

// Tag a fetch so it can be invalidated by tag later
const data = await fetch('https://api.example.com/items', {
  next: { tags: ['items'] },
});
```

---

## 3. `use cache`: granular caching (Cache Components)

`cacheComponents: true` is enabled in `next.config.ts`, which turns on `use cache`, `cacheLife`, and `cacheTag`. This caches at the function or component level, not just the segment.

```tsx
// File level: the entire module's output is cached
'use cache';
import { cacheLife } from 'next/cache';

export default async function Page() {
  cacheLife('hours');
  const data = await fetch('https://api.example.com/data');
  return <div>{/* ... */}</div>;
}

// Component level
export async function ProductCard({ id }: { id: string }) {
  'use cache';
  cacheLife('days');
  const product = await fetch(`https://api.example.com/products/${id}`);
  return <div>{/* ... */}</div>;
}

// Function level
export async function getSummary() {
  'use cache';
  cacheLife('minutes');
  return await loadSummary();
}
```

### `cacheLife()` profiles

Each profile has a `stale` window (how long a client may serve a cached value before checking), a `revalidate` window (how often the server refreshes in the background), and an `expire` window (the hard limit after which the value must be refetched).

| Profile     | Stale  | Revalidate | Expire   | Typical use case                  |
|-------------|--------|------------|----------|-----------------------------------|
| `'seconds'` | 30s    | 1s         | 1min     | Near real-time data               |
| `'minutes'` | 5min   | 1min       | 1h       | Frequently changing feeds         |
| `'hours'`   | 5min   | 1h         | 1 day    | Slowly changing listings          |
| `'days'`    | 5min   | 1 day      | 1 week   | Articles, reference content       |
| `'weeks'`   | 5min   | 1 week     | 30 days  | Rarely changing content           |
| `'max'`     | 5min   | 30 days    | 1 year   | Legal docs, static assets         |

Pick the server data cache window to conceptually mirror the client `STALE` profiles used for client-side fetching (see `state.md`). If the client treats a resource as fresh for minutes, the server cache for the same resource should not be locked to hours, and vice versa. Keep the two layers aligned so users do not see one layer contradict the other.

### Tags with `use cache`

```ts
import { cacheTag, cacheLife } from 'next/cache';

export async function getUserItems(userId: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(`user-${userId}`, 'items');
  return await loadUserItems(userId);
}

// Server Action: invalidate when the data changes
'use server';
import { revalidateTag } from 'next/cache';

export async function saveItem(userId: string) {
  await persistItem(/* ... */);
  revalidateTag(`user-${userId}`); // invalidate this user's cache
  revalidateTag('items');          // invalidate the shared list cache
}
```

### Key constraint: `use cache` and dynamic data

`cookies()`, `headers()`, and `searchParams` cannot be called inside a `use cache` block. Read them outside and pass the values in as arguments so they become part of the cache key.

```tsx
// Not allowed: reading the request inside a cached block
export async function UserData() {
  'use cache';
  const token = (await cookies()).get('auth'); // Error
}

// Correct: read outside, pass in as a prop
export default async function Page() {
  const token = (await cookies()).get('auth')?.value;
  return <UserData token={token} />;
}

export async function UserData({ token }: { token?: string }) {
  'use cache';
  cacheLife('minutes');
  // token is part of the cache key
}
```

---

## 4. PPR: Partial Prerendering

A static shell is delivered instantly and dynamic sections stream in. With `cacheComponents: true`, PPR and `use cache` are unified. There is no separate flag and no per-segment export: you opt in simply by wrapping dynamic parts in `<Suspense>`.

```tsx
import { Suspense } from 'react';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getMeta(id); // static: prerendered into the shell

  return (
    <div>
      <Header title={meta.title} />       {/* static */}

      <Suspense fallback={<ListSkeleton />}>
        <ItemList sectionId={id} />       {/* dynamic: streamed */}
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        <UserPanel sectionId={id} />      {/* dynamic: streamed */}
      </Suspense>
    </div>
  );
}

// Automatically dynamic because it reads the request
async function UserPanel({ sectionId }: { sectionId: string }) {
  const userId = (await cookies()).get('uid')?.value;
  const data = await getUserData(sectionId, userId);
  return <Panel {...data} />;
}
```

---

## 5. SSR Dynamic

A route becomes dynamic automatically when it uses:

- `cookies()` or `headers()` (reading from the request)
- `searchParams` passed to the page
- `fetch` with `cache: 'no-store'`

```tsx
export const dynamic = 'force-dynamic'; // force it explicitly when needed

export default async function Account() {
  const userId = (await cookies()).get('uid')?.value;
  const data = await getUserData(userId); // fresh render on every request
  return <AccountShell data={data} />;
}
```

---

## 6. Fetch cache options: quick reference

```ts
fetch(url, { cache: 'force-cache' });              // cached (default in static mode)
fetch(url, { cache: 'no-store' });                 // never cached (makes the route dynamic)
fetch(url, { next: { revalidate: 3600 } });        // ISR: revalidate after N seconds
fetch(url, { next: { tags: ['items', 'stock'] } }); // tag for on-demand invalidation
```

---

## 7. Always prefer Next.js built-ins over raw tags

Never hand-roll a tag when Next.js ships an optimized equivalent. These are enforced by lint and static analysis, so a raw tag fails `pnpm check`.

| Instead of              | Use                | Import              |
|-------------------------|--------------------|---------------------|
| `<img>`                 | `<Image>`          | `next/image`        |
| `<a>` (internal link)   | `<Link>`           | `next/link`         |
| `<script>`              | `<Script>`         | `next/script`       |
| `<form>`                | `<Form>`           | `next/form`         |
| `useRouter` (legacy)    | `useRouter`        | `next/navigation`   |
| `usePathname`           | `usePathname`      | `next/navigation`   |
| `useSearchParams`       | `useSearchParams`  | `next/navigation`   |

- Images: use `next/image`. The semgrep rule `no-external-image-assets` also forbids remote image URLs. Copy assets into `public/` and reference them by local path so they are optimized and served from your own origin.
- Internal links: use `next/link`. Enforced by the ESLint rule `bedrock/no-internal-link-anchor` and the ast-grep rule `no-internal-link-anchor`. Use a raw `<a>` only for external URLs or `mailto:`/`tel:` links.
- Scripts: use `next/script` so loading strategy is controlled and does not block hydration.
- Forms: use `next/form` for progressively enhanced navigation and submission.
- Navigation hooks: import `useRouter`, `usePathname`, and `useSearchParams` from `next/navigation` (not the legacy router).

---

## 8. Browser logs in the dev terminal

`next.config.ts` sets `logging.browserToTerminal: "warn"`, so browser warnings and errors are forwarded to the dev terminal. You can catch client-side failures without opening the browser console. Watch the terminal while developing and treat forwarded warnings as real signal, not noise.

---

## 9. Checklist before creating a route

- [ ] Does the data change per authenticated user? Use SSR dynamic.
- [ ] Same for everyone but changes periodically? Use ISR or `use cache` + `cacheLife`.
- [ ] Static shell plus dynamic sections? Use PPR + `<Suspense>`.
- [ ] Purely interactive with no server data? Use a `"use client"` leaf.
- [ ] Data effectively never changes (landing page, docs)? Use static (the default).
- [ ] Must the cache be invalidated the moment data changes? Use `cacheTag` + `revalidateTag`.
- [ ] Does the server cache window match the client `STALE` profile for the same resource? (see `state.md`)
