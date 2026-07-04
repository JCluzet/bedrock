# State, data fetching, and forms

> Read this before adding state, a store, a mutation, or a form.

Bedrock splits state into three layers, each with its own tool and its own
guardrails wired into `pnpm check`. Pick the layer by what the state *is*, not by
what feels convenient.

```
Local toggle / animation   ->  useState
Data at initial page load  ->  Server Component (no library)
Server data, client-side   ->  TanStack Query
Global UI state            ->  Zustand
Forms                      ->  react-hook-form + Zod
```

Use the least powerful solution that works. Never reach for a global store when
`useState` is enough, and never fetch in a Client Component when a Server
Component can do it.

---

## Layer 1: server state (TanStack Query)

Anything that lives in the database or comes from an API is server state. On the
client it goes through TanStack Query, never into a Zustand store and never into
raw `fetch()` inside an effect.

### Query keys come from a typed factory

<a id="querykeys"></a>

Every `queryKey` MUST come from a typed `*Keys` factory (see
`lib/query/keys.ts`), never an inline array literal. A factory defines the key
shape once, so `useQuery` reads and `invalidateQueries` writes always target the
same entries. Drifting inline arrays silently miss invalidations.

```ts
// lib/query/keys.ts (shipped example)
export const exampleKeys = {
  all: ["example"] as const,
  lists: () => [...exampleKeys.all, "list"] as const,
  detail: (id: string) => [...exampleKeys.all, "detail", id] as const,
};
```

Write one factory per feature, e.g. a `user` feature:

```ts
export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};
```

```ts
// OK: from the factory
useQuery({ queryKey: userKeys.detail(id), queryFn: getUser });
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Blocked by semgrep no-inline-query-key
useQuery({ queryKey: ["users", id], queryFn: getUser });
```

`all` is the entity-wide key for blanket invalidation. The other members narrow
by id or filter.

### Cache windows come from named profiles

<a id="staletime"></a>

`staleTime` and `gcTime` MUST reference a named profile from
`lib/query/stale-times.ts`, never a magic number. One place to retune a window,
one vocabulary shared across every hook.

```ts
// lib/query/stale-times.ts (shipped)
export const STALE = {
  realtime: 0,
  frequent: 30_000, // 30s
  standard: 5 * 60_000, // 5min
  static: 60 * 60_000, // 1h
} as const;
```

```ts
import { useQuery } from "@tanstack/react-query";

import { userKeys } from "@/lib/query/keys";
import { STALE } from "@/lib/query/stale-times";

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    staleTime: STALE.standard,
  });
}
```

```ts
// Blocked by semgrep no-magic-stale-time
useQuery({ queryKey: userKeys.detail(id), queryFn: () => getUser(id), staleTime: 300000 });
```

The global `new QueryClient({ defaultOptions })` baseline in your provider is a
client-wide default, not a per-query window, so it sits outside this rule.

### Mutations invalidate through the same factory

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userKeys } from "@/lib/query/keys";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
```

### Never fetch in an effect

Fetching in `useEffect` is blocked by semgrep `no-fetch-in-use-effect`. It
causes client-side waterfalls, race conditions, and double-fetches. Instead:

- Data needed at first paint: fetch in a Server Component.
- Data fetched after interaction (search, filter, load more): TanStack Query.
- Data the user changes (submit, edit, delete): an explicit mutation.

```ts
// Blocked by semgrep no-fetch-in-use-effect
useEffect(() => {
  fetch("/api/user").then((r) => r.json()).then(setUser);
}, []);
```

---

## Layer 2: client UI state (Zustand)

<a id="stores"></a>

Zustand stores hold UI state ONLY: is a panel open, which tab is active, a
transient toggle. Server data never belongs in a store, not even as a pre-seeded
snapshot. That is what TanStack Query is for.

### Stores must not import server types

Store files must not import a feature's server `types`. This is enforced by a
`no-restricted-imports` rule scoped to store globs. If a payload shaped like a
database row is landing in a store, the data is in the wrong layer. Move it to a
query and let the store hold only UI flags.

### Always select with a selector

Rule `bedrock/zustand-require-selector`: read from a store with a selector, never
by destructuring the whole store. Destructuring subscribes the component to every
field, so it re-renders on any change.

```ts
// lib/stores/use-sidebar-store.ts
import { create } from "zustand";

interface SidebarStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

```tsx
// OK: selects one field, re-renders only when isOpen changes
const isOpen = useSidebarStore((state) => state.isOpen);

// Blocked by bedrock/zustand-require-selector
const { isOpen } = useSidebarStore();
```

Keep one store per concern. Do not build a single giant store for the whole app.

---

## Layer 3: forms (Zod)

Rule `bedrock/forms-must-use-zod`: every form validates with a Zod schema. The
schema is the single source of truth for both validation and the TypeScript type,
typically wired through react-hook-form and `@hookform/resolvers`.

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  displayName: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Enter a valid email"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const onSubmit = async (data: ProfileForm) => {
    await saveProfile(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("displayName")} />
      {errors.displayName ? <p>{errors.displayName.message}</p> : null}
      <input {...register("email")} />
      {errors.email ? <p>{errors.email.message}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        Save
      </Button>
    </form>
  );
}
```

Rules of thumb:

- Define the schema with `z.object(...)` and infer the type with
  `z.infer<typeof schema>`. Never hand-write a parallel type.
- Register every field. Do not mix uncontrolled inputs without `register()`.

---

## Web storage stays in storage modules

Direct access to `localStorage` or `sessionStorage` is blocked by semgrep
`no-web-storage-outside-storage-modules`. Scattered calls are impossible to make
SSR-safe, testable, or consistent about serialization.

Wrap web storage in a dedicated module or hook, then consume that everywhere:

```ts
// lib/storage/theme-storage.ts
const KEY = "theme";

export const themeStorage = {
  get: (): string | null =>
    typeof window === "undefined" ? null : window.localStorage.getItem(KEY),
  set: (value: string): void => {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, value);
  },
};
```

```ts
// Blocked by semgrep no-web-storage-outside-storage-modules (outside a storage module)
const theme = localStorage.getItem("theme");
```

---

## Guardrail summary

Each rule is a blocking error, not a warning. When one fires, fix the code rather
than weaken the rule.

| Guardrail | Anchor | Enforced by |
|-----------|--------|-------------|
| No inline `queryKey` arrays | [#querykeys](#querykeys) | semgrep `no-inline-query-key` |
| No magic `staleTime` / `gcTime` | [#staletime](#staletime) | semgrep `no-magic-stale-time` |
| No fetch inside `useEffect` | this section | semgrep `no-fetch-in-use-effect` |
| Stores select with a selector | [#stores](#stores) | eslint `bedrock/zustand-require-selector` |
| Stores never import server types | [#stores](#stores) | eslint `no-restricted-imports` (store globs) |
| Forms validate with Zod | this file | eslint `bedrock/forms-must-use-zod` |
| Web storage only in storage modules | this section | semgrep `no-web-storage-outside-storage-modules` |
