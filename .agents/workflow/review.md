# Code Review Workflow

Review the staged changes, or the pull request, depending on what the user asks for.

The review is focused on one thing: very clean code that is SCALABLE and respects
the SOLID principles. A senior CTO should be proud of the change.

Check it thoroughly, end to end:
- Any hacked-together workaround that should be done properly?
- Any dead code left behind?
- Any duplication that should be unified, or a component that should have been
  reused instead of re-implemented? If so, restructure it, even if that means
  reshaping a whole component.
- Is the design system used consistently (semantic tokens, shadcn primitives),
  or are there one-off styles that should be unified?
- Any security issue, or any newly introduced bug?

The goal is code that is genuinely simple to maintain and to scale. If anything
sends a signal contrary to SOLID and scalable code, fix it.

## Severity bar

- **P0**: critical merge blocker: major vulnerability, data corruption, RCE, auth
  bypass, something that can break production.
- **P1**: very important: wrong product or architecture direction, serious bug,
  misleading production behavior.
- **P2**: important: structural debt, insufficient robustness, incomplete cleanup,
  contracts in the wrong place.
- **P3**: secondary but real: polish, a rule violation, a weak signal worth fixing.

## Logging and observability (evlog)

Read `.agents/rules/logging.md` before judging.

- Is every new API route wrapped with `withEvlog()` and using `useLogger()` +
  `log.set()` for business context?
- Are errors created with `createError({ status, message, why, fix })` instead of
  `throw new Error()` in server code?
- Do error paths (catch, fallback, degraded state) log with `log.error()` or
  `log.warn()` rather than `console.*`?
- Do logs carry enough context to be traceable (the ids and fields that matter
  for the action)?
- If existing code is modified and is missing structured logging, that is a P3.

## Rules

If you are unsure, check the `.agents/rules/*.md` files. If you spot a rule that
is out of date, flag it so it can be updated. If a new rule would make the code
more scalable or more SOLID, propose adding it: rules are append-only, never
removed to make code pass.
