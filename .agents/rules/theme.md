# Design System and Theming Rules

Read this before creating or modifying a component, choosing a color or font.

This file is the authority on design decisions. Every failure from `pnpm check` that
points here is telling you the same thing: use the semantic tokens and the three font
roles, never raw values. Fix the code, do not weaken the rule.

---

## Tech stack

- Framework: Next.js 16 (App Router)
- CSS: Tailwind CSS v4 (CSS-first config via `@theme inline` in `styles/globals.css`)
- Fonts: `next/font`, loaded in `app/layout.tsx` and exposed as CSS variables
- All tokens live in `styles/globals.css`. That file is the single source of truth.

---

## Light only

This template is light-only by design. Every token is defined once on `:root` in
`globals.css`, and that is the single source of truth for color.

There is no dark mode: no theme provider, no toggle, no `data-theme` is ever set.
The vendored shadcn primitives still ship `dark:` utility classes, but the `dark`
variant is intentionally inert (it targets `[data-theme="dark"]`, which nothing
sets), so they never activate. Do not use the `dark:` variant in your own code. If
you want theming later, that is a deliberate feature to add, not a default.

---

## Always use semantic tokens

The golden rule: never write a raw color. Use the semantic token, and it adapts to the
active theme automatically.

```html
<!-- Correct -->
<div class="bg-background text-foreground">
  <div class="bg-card text-card-foreground border">
    <p class="text-muted-foreground">Secondary copy</p>
    <button class="bg-primary text-primary-foreground">Action</button>
  </div>
</div>

<!-- Wrong: fights the theme, blocked by the guardrails -->
<div class="bg-white text-black border-zinc-200">...</div>
```

Common usage:

- `bg-background text-foreground` for the page surface and default text.
- `bg-card text-card-foreground` for boxes and panels.
- `text-muted-foreground` for secondary text, labels, captions.
- `border` for default borders (the base layer sets `border-color` to the border token).

### Token reference

Every token below exists as both a CSS variable (`--token`) and a Tailwind class
(`bg-*`, `text-*`, `border-*`, `ring-*`). Values are defined on `:root` in `globals.css`.

| Tailwind class            | CSS variable            | Usage                                              |
|---------------------------|-------------------------|----------------------------------------------------|
| `bg-background`           | `--background`          | Page surface                                       |
| `text-foreground`         | `--foreground`          | Primary text                                       |
| `bg-card`                 | `--card`                | Cards, boxes, panels                               |
| `text-card-foreground`    | `--card-foreground`     | Text on a card                                     |
| `bg-popover`              | `--popover`             | Modals, dropdowns, elevated overlays               |
| `text-popover-foreground` | `--popover-foreground`  | Text on a popover                                  |
| `bg-primary`              | `--primary`             | Primary CTAs, highlights, active state             |
| `text-primary-foreground` | `--primary-foreground`  | Text on a primary background                       |
| `bg-secondary`            | `--secondary`           | Alternate surfaces                                 |
| `bg-muted`                | `--muted`               | Muted surfaces                                     |
| `text-muted-foreground`   | `--muted-foreground`    | Secondary text, labels, placeholders               |
| `bg-accent`               | `--accent`              | Hover and highlight surfaces                       |
| `bg-destructive`          | `--destructive`         | Dangerous or error actions                         |
| `border`                  | `--border`              | Default borders                                    |
| `border-input`            | `--input`               | Form control borders                               |
| `ring-ring`               | `--ring`                | Focus rings                                        |
| `*-chart-1` .. `*-chart-5`| `--chart-1..5`          | Data visualization series                          |
| `*-sidebar*`              | `--sidebar*`            | Sidebar surface, foreground, primary, accent, border, ring |

Each color token also has a matching `*-foreground` where relevant (card, popover, primary,
secondary, muted, accent, destructive, sidebar). Use the pair together for legible contrast.

---

## Guardrails (enforced by `pnpm check`)

These lint rules are blocking. A violation points back to this file.

- `bedrock/no-raw-color-literals`: no hex, `rgb()`, `hsl()`, or `oklch()` literals anywhere
  in application code, including inline `style={{ ... }}`, `fill=`, and `stroke=`. Add or
  reference a token in `globals.css` instead.
- `bedrock/no-raw-tailwind-colors`: no built-in Tailwind color classes (`bg-white`,
  `text-zinc-500`, `border-slate-200`) and no arbitrary color values (`bg-[#0f0f0f]`,
  `text-[hsl(...)]`). Use the semantic token classes above.
- `bedrock/no-heading-without-display-font`: every `h1`, `h2`, and `h3` must carry
  `font-display`.
- `bedrock/no-code-without-mono-font`: every `code` and `pre` must carry `font-mono`.
- `bedrock/no-filter-invert`: no `filter: invert()` tricks to fake theming. Style through
  tokens, never by inverting rendered pixels.

---

## Typography: three font roles

Three roles are wired through `next/font` in `app/layout.tsx` and registered in `globals.css`.
Use the Tailwind class, never a raw `font-family`.

| Tailwind class | CSS variable    | Role                                   |
|----------------|-----------------|----------------------------------------|
| `font-sans`    | `--font-sans`   | Body and UI copy (default via `body`)  |
| `font-display` | `--font-display`| Headings, hero text, branding          |
| `font-mono`    | `--font-mono`   | Code, terminals, keyboard keys         |

```html
<h1 class="font-display font-bold text-4xl">Title</h1>
<p>Body copy inherits font-sans from the base layer.</p>
<code class="font-mono text-sm">const x = 1;</code>
```

`body` already sets `font-sans`, so plain prose needs no class. Headings and code do need
the explicit role class, and the guardrails enforce it.

---

## Border radius

Radius is driven by a single `--radius` token. `--radius-sm`, `--radius-md`, `--radius-lg`,
and `--radius-xl` derive from it. Use the `rounded-*` utilities that map to these tokens
rather than arbitrary pixel values, so radius stays consistent and tunable from one place.

---

## Checklist for any component

1. Colors come from semantic tokens only. No hex, no `rgb`/`hsl`/`oklch`, no built-in
   Tailwind palette classes, no arbitrary color values.
2. Headings (`h1`-`h3`) use `font-display`. `code` and `pre` use `font-mono`. Body
   inherits `font-sans`.
3. No `dark:` variant and no `filter: invert()`: the template is light-only.
4. Do not add a new token without a concrete, immediate need (YAGNI). When you do add one,
   define it on `:root` in `globals.css`.

## Cursor

Enabled buttons and `[role="button"]` elements show a pointer cursor. This is set
once as a base rule in `globals.css` (Tailwind v4 drops it by default), so you do
not add `cursor-pointer` per button. Disabled buttons keep the default cursor.
