# AGENTS.md: Bedrock

Bedrock is an AI-native Next.js + Tailwind starter template. Its rules are not
suggestions in prose: they are algorithmic guardrails wired into `pnpm check`.
Every check is pass or fail, and every failure message points to the exact
`.agents/rules/*.md` section that explains why.

Read this file first, then consult the rule file for your task.
If you want a way of doing something that is not documented here, propose adding it.

---

## Active rules

| When to read | File |
| --- | --- |
| Before changing domain boundaries, feature contracts, or cross-feature imports | `.agents/rules/architecture.md` |
| Before creating, moving, or naming any file or folder | `.agents/rules/structure.md` |
| Before creating any React component (orchestrator, presenter, hook) | `.agents/rules/components.md` |
| Before creating or modifying a component, choosing a color or font | `.agents/rules/theme.md` |
| Before creating, copying, or adapting any UI component | `.agents/rules/ui-components.md` |
| Before configuring rendering or caching for a route, page, or function | `.agents/rules/rendering.md` |
| Before adding state, a store, a mutation, or a form | `.agents/rules/state.md` |
| Before creating API routes, server actions, or handling errors | `.agents/rules/logging.md` |
| Before testing a feature end-to-end (browser, logs, verification) | `.agents/workflow/test-feature.md` |

---

## The one command

`pnpm check` runs the whole gate in parallel: type-check, lint (ESLint with the
custom `bedrock` plugin + typescript-eslint strict type-checked presets),
`guardrails:inventory`, `guardrails:ast` (ast-grep), `guardrails:dup` (jscpd,
threshold 0), `guardrails:deps` (dependency-cruiser), `guardrails:knip` (dead
code), `guardrails:semgrep`, and `test:coverage` (Vitest).

Run `pnpm check` before considering any task done. A green tree is the contract.

---

## Rule governance: append-only

This is the core of Bedrock. Treat the rule set as append-only.

- **Add freely.** Whenever a new rule would make the code more scalable or more
  SOLID-compliant, add it: a new ESLint rule in `tools/eslint-plugin-bedrock`, a
  new semgrep or ast-grep rule, or a new guardrail runner. Give it a matching
  section in `.agents/rules`, make its failure message point there with a
  `See ...` reference, and wire it into `pnpm check`.
- **Never remove.** Do not delete, disable, or weaken an existing rule to make
  code pass. A conflict between a rule and your code is a design smell: fix the
  design so it complies. Rules are how the codebase stays clean as it grows with
  AI, so they only ever get stronger.

The one exception already encoded in the config: the vendored shadcn layer
(`components/ui/**`, `hooks/**`) follows shadcn's conventions, not this project's
authored-code rules. Everything you write is fully governed.

---

## Always keep in mind

- **shadcn first.** Never write a raw `<button>`, `<input>`, `<div className="card">`,
  etc. when a primitive exists in `components/ui/`. See `ui-components.md`.
- **Compose, do not reinvent.** Build custom components by assembling shadcn
  primitives (`Card`, `Button`, `Badge`, `Input`, ...), not raw HTML + Tailwind.
- **Semantic tokens.** Use tokens (`bg-background`, `bg-card`, `bg-muted`,
  `text-foreground`, `text-muted-foreground`, ...). Never hardcode raw colors
  (`bg-white`, `text-black`). The template is light-only: do not use the `dark:`
  variant. See `theme.md`.
- **Icons: Remix Icon** (`@remixicon/react`). Never `lucide-react` in your code.
- **Colors and fonts** live in `styles/globals.css`. Never invent values outside
  the palette.
- **Colocation.** A file used by only one route goes in that route's `_components/`
  or `_actions/`.
- **The `@/` alias is mandatory.** Never use upward relative paths (`../../`).

---

## Component architecture

Every non-trivial component is split into three roles, each in its own folder:

- **Orchestrator** (`orchestrators/`): wires data and state to a presenter. Calls
  hooks, passes ready-to-render props down. No raw markup, no direct fetch.
- **Presenter** (`presenters/`): pure and presentational. Props in, JSX out. No
  data transforms, no side effects, no smart hooks or imports.
- **Hook** (`hooks/`, `use*.ts`): logic and state. Returns data and handlers, no JSX.

One component per file. See `components.md` for the full contract.

---

## Before using any library or Next.js API

1. Check the exact version in `package.json`.
2. Read the official docs for that exact version. Libraries move fast: never
   assume the API matches your training data.
3. This is Next.js App Router with React Server Components. Default to Server
   Components; add `"use client"` only when you need interactivity or state.

### Next.js built-ins: always prefer these

| Instead of | Use | Import |
| --- | --- | --- |
| `<img>` | `<Image>` | `next/image` |
| `<a>` (internal link) | `<Link>` | `next/link` |
| `<script>` | `<Script>` | `next/script` |
| `<form>` | `<Form>` | `next/form` |
| `useRouter` / `usePathname` / `useSearchParams` | same | `next/navigation` |
| Fonts via CDN | `next/font/google` | already configured |

---

## Code principles

**YAGNI: You Aren't Gonna Need It.** Never add code, config, or abstractions for a
hypothetical future need. Build only what is required now.

**SOLID.**
- **S**ingle Responsibility: one component or function does one thing.
- **O**pen/Closed: extend via composition or props, never by editing internals.
- **L**iskov Substitution: a variant must be usable wherever the base is used.
- **I**nterface Segregation: do not force a component to accept props it does not
  use; split it instead.
- **D**ependency Inversion: depend on abstractions (props, interfaces, context),
  not concrete implementations.

---

## After every change

Run `pnpm check`. If it fails, fix the code to comply, never weaken the rule.
Before committing, run `pnpm build`.
