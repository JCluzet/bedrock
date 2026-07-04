# Bedrock: Project Structure and File Placement Rules

Read this before creating, moving, or naming any file or folder.

This is the definitive reference for where a file lives. It resolves the "colocate vs. share" question once and for all, and it maps every placement to the ESLint rule that enforces it. Most violations here are caught by `pnpm check`, and each failure points back to a section in this document.

---

## Canonical project structure

```
bedrock/
├── app/                          <- Next.js App Router (routing ONLY)
│   ├── (marketing)/              <- Public pages, no auth required
│   │   ├── layout.tsx
│   │   ├── page.tsx              -> /
│   │   ├── pricing/page.tsx      -> /pricing
│   │   └── _components/
│   │       └── [subject]/
│   │           ├── orchestrators/ <- smart components used only in (marketing)
│   │           └── presenters/    <- dumb components used only in (marketing)
│   ├── (app)/                    <- Authenticated pages
│   │   ├── layout.tsx            <- auth guard + app shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx          -> /dashboard
│   │   │   ├── _components/
│   │   │   │   └── [subject]/
│   │   │   │       ├── orchestrators/
│   │   │   │       └── presenters/
│   │   │   ├── _hooks/
│   │   │   │   └── [subject]/    <- route-local React hooks
│   │   │   ├── _lib/
│   │   │   │   └── [subject]/    <- route-local helpers / formatters / glue
│   │   │   └── _actions/         <- Server Actions used only in /dashboard
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── _components/
│   │       │   └── [subject]/
│   │       │       ├── orchestrators/
│   │       │       └── presenters/
│   │       ├── _hooks/
│   │       │   └── [subject]/
│   │       ├── _lib/
│   │       │   └── [subject]/
│   │       └── _actions/
│   └── api/                      <- Route Handlers only
│       └── [route]/route.ts
│
├── components/                   <- Generic reusable components
│   ├── ui/                       <- Vendored shadcn primitives (Button, Card, Input...)
│   └── shared/
│       └── [subject]/
│           ├── orchestrators/    <- shared smart shells / layout wiring
│           └── presenters/       <- shared dumb UI blocks
│
├── features/                     <- Business logic by domain
│   ├── profile/
│   │   ├── [subject]/            <- e.g. avatar/, header/, ...
│   │   │   ├── components/
│   │   │   │   ├── orchestrators/ <- smart client components
│   │   │   │   └── presenters/    <- dumb render-only components
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   ├── hooks/                <- feature-wide hooks not tied to one subject
│   │   ├── lib/                  <- feature-wide helpers / glue
│   │   ├── actions.ts
│   │   └── types.ts
│   └── settings/
│       ├── [subject]/
│       │   ├── components/
│       │   │   ├── orchestrators/
│       │   │   └── presenters/
│       │   ├── hooks/
│       │   └── lib/
│       ├── hooks/
│       ├── actions.ts
│       └── types.ts
│
├── lib/                          <- Third-party clients & technical utilities
│   ├── fonts.ts                  <- next/font exports (imported by layout.tsx)
│   ├── utils.ts                  <- cn() class-merge helper (Tailwind + clsx)
│   ├── stores/                   <- Global state stores
│   └── env/                      <- Environment variable validation
│
├── styles/
│   └── globals.css               <- Tailwind @import + @theme tokens + @layer
│
├── types/                        <- Global TypeScript types (shared interfaces, enums)
│
├── .agents/rules/                <- AI agent rules (this file lives here)
└── AGENTS.md                     <- Rules index (read first)
```

---

## The single decision rule: where does a file go?

### Components

```
How many routes use this component?
│
├── Only 1 route
│   └── -> app/(group)/[route]/_components/[subject]/[role]/   <- COLOCATE
│
├── Multiple routes in the same business domain (profile, settings...)
│   └── -> features/[feature]/[subject]/components/[role]/     <- FEATURE
│
└── Everywhere / no specific domain / UI primitive
    ├── It's a design system primitive (button, input, badge...)
    │   └── -> components/ui/
    └── It's a shared UI block (nav, footer, modal shell...)
        └── -> components/shared/[subject]/[role]/
```

### Component role folders

Every component under a feature or shared component folder must sit in exactly one role folder: `orchestrators/`, `presenters/`, or `hooks/`. An orchestrator is a smart component (data, state, side effects). A presenter is a dumb, render-only component. This is enforced by `bedrock/no-unclassified-component-role`.

Each component file also lives on its own: one component per file, enforced by `bedrock/one-component-per-file`.

Valid patterns:
- `app/**/_components/[subject]/orchestrators/**` -> route-level smart components
- `app/**/_components/[subject]/presenters/**` -> route-level dumb components
- `features/**/[subject]/components/orchestrators/**` -> feature-level smart components
- `features/**/[subject]/components/presenters/**` -> feature-level dumb components
- `components/shared/[subject]/orchestrators/**` -> shared smart components
- `components/shared/[subject]/presenters/**` -> shared dumb components

Never place a component file directly in a container without a subject and role:
- `app/**/_components/`
- `app/**/_components/[subject]/`
- `features/**/components/`
- `features/**/[subject]/components/`
- `components/shared/`
- `components/shared/[subject]/`

Role folders hold their component kind and nothing else. Do not drop `.ts` helpers, stores, mappers, or view-model utilities into an `orchestrators/` or `presenters/` folder. This is enforced by `bedrock/no-support-files-in-component-role-folders`. If a file is not a presenter or orchestrator, it does not belong in `components/`. Move it to a role-specific sibling instead:
- `app/**/_hooks/**`
- `app/**/_lib/**`
- `features/**/hooks/**`
- `features/**/lib/**`

### Support files (helpers, hooks, glue)

Non-component files must be classified into a purpose folder, never left loose.

- No stray `.ts` support file at a feature root: put it in `lib/`, `hooks/`, or a subject folder. Enforced by `bedrock/no-feature-root-support-files`.
- No unclassified route-private file: everything under a route's `_components/`, `_hooks/`, or `_lib/` must sit in a subject folder, not directly in the container. Enforced by `bedrock/no-unclassified-route-support-file`.

```
How local is the non-UI helper?
│
├── Only 1 route
│   └── -> app/(group)/[route]/_lib/[subject]/
│
├── 1 feature
│   ├── feature-wide helper / mapper / formatter -> features/[feature]/lib/
│   └── subject-local helper / mapper            -> features/[feature]/[subject]/lib/
│
└── Global technical utility
    └── -> lib/
```

### Hooks

```
Same logic as components:
├── 1 route          -> app/**/_hooks/[subject]/
├── 1 feature-wide   -> features/[feature]/hooks/
├── 1 feature subject-> features/[feature]/[subject]/hooks/
└── Global           -> lib/
```

### Server Actions

```
How many routes call this action?
│
├── Only 1 route -> app/(group)/[route]/_actions/[name].ts
└── Multiple routes in the same feature -> features/[feature]/actions.ts
```

### TypeScript types

```
├── Specific to a feature -> features/[feature]/types.ts
├── Specific to a route   -> local in _components/ or _actions/ (not exported)
└── Global / shared / API -> types/
```

---

## Naming conventions

| Element              | Convention          | Example                       |
|----------------------|---------------------|-------------------------------|
| Folders / route segments | kebab-case      | `account-settings/`           |
| React components     | PascalCase          | `ProfileCard.tsx`             |
| Hooks                | camelCase + `use`   | `useProfileData.ts`           |
| Server actions       | camelCase + verb    | `updateProfile.ts`            |
| Utilities            | camelCase           | `formatDate.ts`               |
| Types / Interfaces   | PascalCase          | `UserProfile`, `Settings`     |
| Next.js private dirs | underscore prefix   | `_components/`, `_actions/`    |
| Route groups         | parentheses         | `(marketing)/`, `(app)/`      |

---

## Import rules

1. Always use the `@/` path alias. It points to the project root (configured in `tsconfig.json`). Parent-relative imports that walk up the tree with `../` are forbidden and caught by `bedrock/no-parent-relative-imports`. Sibling imports with `./` are fine.

   - Wrong: `import { cn } from '../../lib/utils'`
   - Right: `import { cn } from '@/lib/utils'`

2. Never import a `_components/`, `_hooks/`, `_lib/`, or `_actions/` file that belongs to another route. Route-private folders are private to their route.

   - `app/(app)/dashboard/_components/chart/presenters/Chart.tsx` is usable only inside `/dashboard`. If a second route needs it, promote it to `features/` or `components/shared/`.

3. Import order (enforced by ESLint):
   ```
   1. External libraries (react, next, ...)
   2. @/components/
   3. @/features/
   4. @/lib/
   5. @/types/
   6. Local relative imports (./)
   ```

---

## Colocation principle

A file used by only one route lives inside that route, in its `_components/`, `_hooks/`, `_lib/`, or `_actions/` folder. Do not lift a file into `features/` or `components/shared/` until a second route actually needs it. Sharing is earned by real reuse, not anticipated by guesswork (see YAGNI in AGENTS.md). When a second consumer appears, promote the file then, and update its imports to the shared location.

---

## Concrete examples

"I'm creating a save button used only on the settings page (dumb UI)"
-> `app/(app)/settings/_components/form/presenters/SaveButton.tsx`

"I'm creating a profile card shown on both the dashboard AND the profile page (dumb UI)"
-> `features/profile/profile-card/components/presenters/ProfileCard.tsx`

"I'm creating a generic Modal used everywhere (dumb UI)"
-> `components/shared/overlays/presenters/Modal.tsx`

"I'm creating a Button primitive"
-> `components/ui/button.tsx` (vendored shadcn)

"I'm creating the action that saves settings, called only from /settings"
-> `app/(app)/settings/_actions/saveSettings.ts`

"I'm creating the action that loads a profile, used by two routes in the profile feature"
-> `features/profile/actions.ts`

"I'm creating a date formatter used across the whole app"
-> `lib/utils.ts` (or a dedicated `lib/[name].ts`)

---

## What we do NOT do

- Put business logic directly in `app/` (outside `page.tsx`, `layout.tsx`, `_actions/`).
- Import a route-private file from a neighboring route.
- Put a component file directly in `app/**/_components/`, `features/**/components/`, or `components/shared/` without a subject and role folder.
- Put `.ts` helpers inside `presenters/` or `orchestrators/`.
- Leave route-private hooks or helpers directly in `_hooks/` or `_lib/` without a subject folder.
- Leave stray `.ts` helpers at a feature root instead of `lib/`, `hooks/`, or a subject folder.
- Create a catch-all `utils/` folder at the root.
- Put types inside component files unless they are strictly local and non-reusable.
- Use parent-relative `../` imports instead of the `@/` alias.
```