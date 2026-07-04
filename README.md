# Bedrock

**The AI-native Next.js + Tailwind starter where clean architecture is enforced, not hoped for.**

Bedrock turns "please write scalable, SOLID code" from a prompt you repeat into a
set of algorithmic guardrails the machine cannot ignore. Every rule is a pass or
fail gate wired into one command. When a rule fails, its message points to the
exact `.agents/rules/*.md` section that explains why. An AI (or a human) either
writes code that fits the architecture, or the build stops.

## Why it works

Prose in a markdown file gets skimmed and forgotten. Bedrock encodes the same
intent as **hundreds of enforced rules** across a handful of orchestrated checks:

- A custom ESLint plugin (`tools/eslint-plugin-bedrock`, 34 rules) for component
  roles, feature boundaries, the design system, and safe TypeScript.
- typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` presets.
- semgrep and ast-grep for structural patterns.
- jscpd (duplicate code, threshold 0), knip (dead code), dependency-cruiser
  (layering and cycles).
- Vitest with a coverage gate.

One command runs them all:

```bash
pnpm check
```

A green tree is the contract. It runs on every commit via a husky pre-commit hook.

## Stack

Next.js (App Router, RSC), Tailwind CSS v4, TypeScript (strict), shadcn/ui
(new-york) + Remix Icon, Zod, Zustand, TanStack Query, evlog (structured
logging), Vitest. Package manager: pnpm.

## Quickstart

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # run the full guardrail gate
pnpm build
```

External tools: `ast-grep` ships as a dev dependency. `semgrep` is optional; the
guardrail uses your local `semgrep` CLI if present, falls back to Docker, and
otherwise tells you how to install it.

## The architecture

Every non-trivial component is split into three roles, each in its own folder:

- **Orchestrator** (`orchestrators/`): wires data and state to a presenter.
- **Presenter** (`presenters/`): pure and presentational, props in and JSX out.
- **Hook** (`hooks/`, `use*.ts`): logic and state, never JSX.

The landing page in `features/landing/` is a live example of the full pattern:
Hero (orchestrator + presenter), SystemStatus (orchestrator + hook + presenter
with a TanStack Query hitting the evlog-wrapped `/api/health` route), and
CopyCommand (a Zustand store consumed through a selector).

Read `AGENTS.md` first, then the relevant `.agents/rules/*.md`.

## Rule governance: append-only

Rules only get stronger. **Add** a rule whenever it would make the code more
scalable or more SOLID (with a matching `.agents/rules` section and a `See`
message). **Never remove, disable, or weaken** a rule to make code pass: a
conflict is a design smell, so fix the design. The one carve-out already in the
config is the vendored shadcn layer (`components/ui/**`, `hooks/**`), which
follows shadcn conventions rather than this project's authored-code rules.

## Make it yours

- Delete the demo: `rm -rf features/landing` and replace the body of
  `app/page.tsx`. Remove the `/api/health` route and `lib/server/status.ts` if
  you do not want the sample data path.
- Colors and fonts live in `styles/globals.css` (neutral, light-only palette).
  Change the token values, keep the token names.
- Add shadcn components as you need them: `pnpm dlx shadcn@latest add <name>`,
  then add the row to `.agents/rules/ui-components.md`.

## Another package manager?

Bedrock uses pnpm (workspace hooks, `pnpm dlx`). To use npm or yarn, replace the
`pnpm` calls in `package.json` scripts and `tools/guardrails/*.mjs`, and swap the
lockfile. Everything else is standard Node tooling.
