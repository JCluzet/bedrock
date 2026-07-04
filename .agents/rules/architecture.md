# Architecture and Dependency Rules

> Read this before changing domain logic, feature boundaries, cross-layer imports, or module ownership.

Every rule below is enforced by `pnpm check`. When a check fails, it names the rule, and each rule maps back to a section here.

---

## Core principle

Keep the dependency graph flowing in one direction:

`app -> features -> lib`

and for UI:

`components/ui -> components/shared -> feature components -> route UI`

The technical layer never reaches up. The domain never depends on presentation. Routes never reach into each other.

---

## 1. The layers

| Layer            | Contains                                                        | May import from                                  |
|------------------|----------------------------------------------------------------|--------------------------------------------------|
| `app/`           | Routes only: pages, layouts, route handlers, `_components/`, `_actions/` | `features/`, `components/`, `lib/`, `types/`      |
| `features/<name>/` | Domain logic and the feature's own components                | the same feature, `components/ui`, `components/shared`, `lib/`, `types/` |
| `components/ui/` | Vendored shadcn primitives (`Button`, `Card`, `Input`, ...)    | `components/ui`, `lib/`                           |
| `components/shared/` | Cross-feature presentational components                    | `components/ui`, `components/shared`, `lib/`, `types/` |
| `lib/`           | Technical layer only (formatters, clients, pure helpers)       | `lib/`, `types/` only                            |
| `types/`         | Cross-domain shared types                                       | `types/` only                                    |

A feature owns everything about one domain concept (for example a `dashboard` feature or a `profile` feature): its data access, its logic, its hooks, and its components. Code used by only one route stays colocated in that route's `_components/` or `_actions/`.

---

## 2. Directional dependency rules

Each rule is a lint rule. The name is what appears in the `pnpm check` output.

### Features must not depend on routes or global components

Domain modules in `features/` describe behavior, not presentation. They must not import from `app/` or `components/`.

- Forbidden: `features/profile/get-profile.ts` importing `@/components/shared/Card`
- Forbidden: `features/profile/get-profile.ts` importing `@/app/(dashboard)/layout`

See `bedrock/no-feature-domain-imports-from-app-or-components`.

(Feature *components* may still import `components/ui` and `components/shared`. This rule targets domain and data modules.)

### A feature must not import another feature's components

If two features need the same UI, that UI is not feature-specific. Extract a shared contract.

- Forbidden: `features/dashboard/*` importing `@/features/profile/components/Avatar`

See `bedrock/no-cross-feature-ui-imports`.

### lib/ must not import from features/

`lib/` is the technical floor. If a helper needs a feature, it is not a lib helper.

- Forbidden: `lib/format-metrics.ts` importing `@/features/dashboard/...`

See `bedrock/no-lib-imports-from-features` (and the dependency-cruiser `no-lib-to-non-lib` rule).

### components/shared must not import from features/

Shared components are presentational and feature-agnostic. Data flows in through props.

- Forbidden: `components/shared/StatTile.tsx` importing `@/features/dashboard/...`

See `bedrock/no-shared-imports-from-features`.

### A route must not import another route's private folder

`_components/` and `_actions/` are private to their route. If two routes need the same thing, promote it to a feature or to `components/shared`.

- Forbidden: `app/(dashboard)/settings/page.tsx` importing `@/app/(dashboard)/profile/_components/Header`

See `bedrock/no-cross-route-private-imports`.

---

## 3. No import cycles

Cyclic dependencies break tree-shaking and make ownership impossible to reason about.

Enforced by `import-x/no-cycle` and, at the module-graph level, by dependency-cruiser:

- `no-circular`: no cycle anywhere in the graph
- `no-feature-to-app`: `features/` may not reach into `app/`
- `no-feature-domain-to-components`: feature domain modules may not reach into `components/`
- `no-lib-to-non-lib`: `lib/` may not reach outside `lib/`

If you hit a cycle, the fix is usually to move a shared type into `types/` or a shared helper into `lib/`, then have both sides import the neutral module.

---

## 4. Crossing a boundary the right way

When two places need the same thing, do not import across a forbidden edge. Choose one:

- Shared type or contract: put it in `types/` (cross-domain) or the owning feature's `types.ts`.
- Shared technical helper: put it in `lib/`.
- Shared presentational component: put it in `components/shared/`.

Never copy the code. If the current location is wrong, relocate it once instead of duplicating it. Duplicated logic is caught by the gate in section 6.

---

## 5. Import paths

The `@/` alias is mandatory for every import that leaves the current directory. Parent-relative paths (`../`) are forbidden because they hide which layer a module lives in and make moves silently break boundaries.

- Correct: `import { Card } from "@/components/ui/card"`
- Forbidden: `import { Card } from "../../components/ui/card"`

See `bedrock/no-parent-relative-imports`. (Same-directory `./` imports are fine.)

---

## 6. Duplication gate

Copy-pasted logic drifts out of sync and multiplies bugs. The duplication detector runs at threshold 0: any detected clone fails the build.

Run it with:

```
pnpm guardrails:dup
```

This runs jscpd across the source tree. If it reports a clone, extract the shared code into the correct layer (see section 4) rather than silencing the finding.

---

## 7. Review checklist

Before finalizing a change, confirm:

1. Did a domain module in `features/` start importing from `app/` or `components/`?
2. Did I import one feature's components from another feature?
3. Did `lib/` or `components/shared/` start importing from `features/`?
4. Did one route reach into another route's `_components/` or `_actions/`?
5. Did I introduce an import cycle?
6. Did I use a `../` path instead of `@/`?
7. Did I duplicate code that already exists in another layer?

If any answer is "yes", fix the architecture before merging. Every one of these is also enforced mechanically by `pnpm check`, so shipping past them is not an option.
