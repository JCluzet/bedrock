# Component Architecture Rules

> Read this before creating any React component.

Every component in Bedrock plays exactly one of three roles: **orchestrator**, **presenter**, or **hook**. The role is declared by where the file lives, and each role is enforced mechanically by `pnpm check`. When a rule fires, its name points back to the section below.

---

## The triad at a glance

```
        data + state                 ready-to-render props
 hooks ──────────────▶ orchestrator ──────────────────────▶ presenter
 (logic, no JSX)       (wires, no markup)                   (pure JSX, no logic)
```

- **Orchestrator** (`orchestrators/`): calls hooks, wires data and state, renders a presenter. No raw markup, no inline data access.
- **Presenter** (`presenters/`): props in, JSX out. No logic, no side effects, no smart imports.
- **Hook** (`hooks/`, `use*.ts`): all the logic and state. Returns data and handlers. Never returns JSX.

The role is set by folder placement, not by a naming prefix. A file under `presenters/` is a presenter and is linted as one, full stop.

---

## Role folders

Under a feature, components live in a `components/` folder split by role.  `hooks/`
and `lib/` sit beside `components/` at the feature root, not inside it. A larger
feature may group these under a subject subfolder first
(`features/<feature>/<subject>/components/...`). See `structure.md`.

- `features/<feature>/components/orchestrators/**` -> feature orchestrators
- `features/<feature>/components/presenters/**` -> feature presenters
- `features/<feature>/hooks/**` (`use*.ts`) -> feature hooks (sibling of `components/`)
- `components/shared/<subject>/orchestrators/**` -> shared orchestrators
- `components/shared/<subject>/presenters/**` -> shared presenters

Anything that is not a component belongs outside the role folders: `hooks/`, `lib/`, `providers/`. Role folders contain React components only. Do not park mappers, clients, or CSS assets inside `presenters/` or `orchestrators/`.

---

## 1. Orchestrator

An orchestrator is the wiring layer. It pulls data and state in from hooks, shapes nothing more than it must, and hands fully-resolved props down to a presenter. It owns coordination, not markup and not transport.

**Responsibilities**
- Call hooks (`use*`) to get data, state, and handlers.
- Decide which presenter to render and with what props.
- Handle high-level branching (loading, empty, error -> pick a presenter).

**Must NOT**
- Render raw markup instead of a presenter.
- Fetch data or hit a data source inline.

### `bedrock/orchestrator-must-orchestrate`

An orchestrator must return a presenter, not hand-written JSX. If it is building `<div>`s and `<span>`s itself, that markup belongs in a presenter.

```tsx
// features/user-card/components/orchestrators/UserCardOrchestrator.tsx
"use client";
import { useUserCard } from "@/features/user-card/hooks/useUserCard";
import { UserCardPresenter } from "@/features/user-card/components/presenters/UserCardPresenter";

// GOOD: wires the hook, renders a presenter
export function UserCardOrchestrator({ userId }: { userId: string }) {
  const vm = useUserCard(userId);
  return <UserCardPresenter {...vm} />;
}

// BAD: orchestrator renders raw markup itself (rule fires)
export function UserCardOrchestrator({ userId }: { userId: string }) {
  const vm = useUserCard(userId);
  return <div className="card">{vm.name}</div>;
}
```

### `bedrock/orchestrator-no-direct-fetch`

Transport does not live in a component. No `fetch`, no database client, no direct API call inside an orchestrator. Put request logic in a hook or a server action, and let the orchestrator trigger it.

```tsx
// BAD: fetch inline in the orchestrator (rule fires)
export function UserCardOrchestrator({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then((r) => r.json()).then(setUser);
  }, [userId]);
  return <UserCardPresenter name={user?.name ?? ""} />;
}

// GOOD: the hook owns the request, the orchestrator just wires it
export function UserCardOrchestrator({ userId }: { userId: string }) {
  const vm = useUserCard(userId);
  return <UserCardPresenter {...vm} />;
}
```

---

## 2. Presenter

A presenter is pure and presentational. It receives fully-resolved props (formatted strings, computed booleans, flat objects) and returns JSX. It never computes, never fetches, never remembers anything. If a presenter needs a power beyond rendering, that power belongs in a hook or an orchestrator.

**Responsibilities**
- Turn resolved props into JSX composed from shadcn primitives.
- Render nothing when a prop is absent (no invented fallbacks).

**Must NOT**
- Transform data (`.map`/`.filter`/`.reduce`), format, or compute in JSX.
- Run side effects or hold state.
- Import data sources, stores, or clients.
- Use non-presentational React hooks.

### `bedrock/presenter-no-formatting` and semgrep `no-data-transform-in-presenter`

Presenters receive data ready to render. No `.map` that reshapes, no `.filter`, no `.reduce`, no `new Date(...).toLocaleDateString()`, no label-deriving ternary in the JSX. Shape it upstream, in the hook.

```tsx
// features/user-card/components/presenters/UserCardPresenter.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserCardPresenterProps {
  name: string;
  roleLabel: string;
  memberSince: string; // already formatted upstream
  isOnline: boolean;
}

// GOOD: props in, JSX out
export function UserCardPresenter({ name, roleLabel, memberSince, isOnline }: UserCardPresenterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <Badge variant={isOnline ? "default" : "secondary"}>{roleLabel}</Badge>
      </CardHeader>
      <CardContent>Member since {memberSince}</CardContent>
    </Card>
  );
}

// BAD: formatting and transforms inside the presenter (rules fire)
export function UserCardPresenter({ user }: { user: User }) {
  return (
    <Card>
      <CardTitle>{user.name}</CardTitle>
      <CardContent>
        Member since {new Date(user.createdAt).toLocaleDateString()}
        {user.roles.map((r) => r.label).join(", ")}
      </CardContent>
    </Card>
  );
}
```

### `bedrock/presenter-no-side-effects`

No effects, no mutation, no I/O. A presenter is idempotent: same props in, same JSX out. Anything that reaches outside render (timers, `localStorage`, network) is a side effect and belongs in a hook.

### `bedrock/presenter-no-smart-imports`

A presenter must not import data-layer modules: data clients, stores, query modules, providers, gates, or orchestrators. If you need one of those, you are writing an orchestrator.

```tsx
// BAD (rule fires): a presenter importing the data layer
import { db } from "@/lib/db";
import { useUserStore } from "@/features/user/stores/userStore";
```

### `bedrock/presenter-no-smart-react-hooks`

No `useState`, `useEffect`, `useLayoutEffect`, `useReducer`, or data hooks (`useQuery`, ...) in a presenter. Only presentational hooks are allowed (for example `useId`, or a `useTheme`-style read that returns a class). State and effects live in `use*` hooks consumed by the orchestrator.

---

## 3. Hook

A hook holds the logic and state that the orchestrator wires and the presenter consumes. It lives in `hooks/` in a `use*.ts` file and returns data and handlers.

**Responsibilities**
- Own state (`useState`, `useReducer`), effects, and data access.
- Shape raw data into resolved, ready-to-render values.
- Return a flat object of props and callbacks.

**Must NOT**
- Return JSX.

### `bedrock/hook-no-jsx`

A hook returns data, never markup. If you are tempted to return `<Something />`, you actually want a presenter.

```tsx
// features/user-card/hooks/useUserCard.ts
import { formatDate } from "@/lib/format";

// GOOD: logic and shaping, returns a flat view model
export function useUserCard(userId: string) {
  const user = useUser(userId); // data hook
  return {
    name: user.name,
    roleLabel: user.roles[0]?.label ?? "member",
    memberSince: formatDate(user.createdAt),
    isOnline: user.lastSeenAt > Date.now() - 5 * 60_000,
  };
}

// BAD: a hook returning JSX (rule fires)
export function useUserCard(userId: string) {
  const user = useUser(userId);
  return <span>{user.name}</span>;
}
```

---

## Cross-cutting rules

These apply to every role.

### `bedrock/one-component-per-file`

One component per file. The filename is the component name in PascalCase (`UserCardPresenter.tsx` exports `UserCardPresenter`). Tiny private sub-components used only within that file are the only exception.

### `bedrock/no-unclassified-component-role`

Every component file must sit in `orchestrators/`, `presenters/`, or (for a hook) `hooks/`. A `.tsx` component dropped directly into a subject folder or a shared root has no declared role and cannot be linted, so it is rejected. Put it in the folder that matches its role.

### `bedrock/no-unstable-keys`

Never key a list by its array index. Index keys break reconciliation on reorder and insert. Use a stable id from the data.

```tsx
// BAD (rule fires)
{items.map((item, i) => <UserRow key={i} {...item} />)}

// GOOD
{items.map((item) => <UserRow key={item.id} {...item} />)}
```

### `bedrock/no-raw-jsx-primitives`

Compose shadcn primitives instead of hand-rolling raw HTML for buttons, inputs, cards, badges, tables, and dialogs. See `ui-components.md` for the full inventory.

```tsx
// BAD (rule fires): a raw button
<button className="rounded bg-primary px-3 py-1">Save</button>

// GOOD: the shadcn primitive
import { Button } from "@/components/ui/button";
<Button>Save</Button>
```

---

## Prop count

`bedrock/max-component-props` caps a component at 6 props. A longer prop list is a
smell: the component is doing too much, or you are prop-drilling. Two fixes:

- **Group cohesive props into one typed object.** `HeroSection({ copy, actions, status })`
  passes a `copy` object rather than `eyebrow`, `title`, `tagline`, `body` as four
  separate props.
- **Compose with slots.** A layout takes `children` or named `ReactNode` slots and
  arranges them, instead of accepting every leaf's data. `LandingPresenter({ hero,
  demo, roles, solid })` assembles sections it does not need to know the insides of.

A single mega-presenter that renders the whole page is the anti-pattern this
prevents.

## Putting it together

A `dashboard` feature needs a user card. Three files, one per role:

```
features/dashboard/user-card/
  components/
    orchestrators/
      UserCardOrchestrator.tsx   # wires the hook, renders the presenter
    presenters/
      UserCardPresenter.tsx      # resolved props -> JSX from shadcn primitives
  hooks/
    useUserCard.ts               # data access + shaping, returns a view model
```

The data flow is strictly one direction:

```
useUserCard(userId)                     // fetches + shapes
      │  { name, roleLabel, memberSince, isOnline }
      ▼
UserCardOrchestrator                    // wires the hook to the presenter
      │  spreads the same resolved props
      ▼
UserCardPresenter                       // renders, computes nothing
```

```tsx
// features/dashboard/user-card/components/orchestrators/UserCardOrchestrator.tsx
"use client";
import { useUserCard } from "@/features/dashboard/user-card/hooks/useUserCard";
import { UserCardPresenter } from "@/features/dashboard/user-card/components/presenters/UserCardPresenter";

export function UserCardOrchestrator({ userId }: { userId: string }) {
  const vm = useUserCard(userId);
  return <UserCardPresenter {...vm} />;
}
```

Each layer stays in its lane, and `pnpm check` fails loudly the moment one of them reaches into another's job. When a rule fires, come back to its section here.
