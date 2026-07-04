# UI Components

> Read this before creating, copying, or adapting any UI component.

Bedrock ships the full shadcn/ui base library (new-york style) under
`components/ui/`. These are vendored primitives: copy them, compose them, but do
not rebuild them from raw HTML.

## Core rules

- **shadcn first.** Never write a raw `<button>`, `<input>`, `<select>`,
  `<textarea>`, `<table>`, `<dialog>`, `<form>` in app or feature code. Use the
  matching primitive below. Enforced by `bedrock/no-raw-jsx-primitives` and the
  ast-grep `no-raw-jsx-primitives` rule.
- **Compose, do not reinvent.** Build custom components by assembling primitives
  (`Card`, `Button`, `Badge`, `Input`, ...), not from raw `<div className="card">`.
  Faux containers are blocked by `bedrock/no-faux-card-containers`,
  `bedrock/no-faux-badge-containers`, and `bedrock/no-faux-alert-containers`.
- **Icons: Remix Icon.** Use `@remixicon/react` in all your code. Never import
  `lucide-react` outside the vendored primitives. Enforced by
  `bedrock/no-lucide-react-imports`.
- **Next built-ins over raw tags.** `next/image` (not `<img>`), `next/link` (not
  `<a>`, enforced by `bedrock/no-internal-link-anchor`), `next/script`, `next/form`.
- **Vendored layer is exempt.** Files under `components/ui/**` and `hooks/**` are
  held to shadcn conventions, not this project's authored-code guardrails. Update
  them with the shadcn CLI. Everything you write is fully governed.

## Inventory

The guardrail `pnpm guardrails:inventory` fails if this list drifts from the
files in `components/ui/`. When you add a component with the shadcn CLI, add its
`@/components/ui/<name>` import here.

| Component | Import |
| --- | --- |
| Accordion | `@/components/ui/accordion` |
| Alert | `@/components/ui/alert` |
| Alert Dialog | `@/components/ui/alert-dialog` |
| Aspect Ratio | `@/components/ui/aspect-ratio` |
| Avatar | `@/components/ui/avatar` |
| Badge | `@/components/ui/badge` |
| Breadcrumb | `@/components/ui/breadcrumb` |
| Button | `@/components/ui/button` |
| Calendar | `@/components/ui/calendar` |
| Card | `@/components/ui/card` |
| Chart | `@/components/ui/chart` |
| Checkbox | `@/components/ui/checkbox` |
| Collapsible | `@/components/ui/collapsible` |
| Command | `@/components/ui/command` |
| Context Menu | `@/components/ui/context-menu` |
| Dialog | `@/components/ui/dialog` |
| Drawer | `@/components/ui/drawer` |
| Dropdown Menu | `@/components/ui/dropdown-menu` |
| Form | `@/components/ui/form` |
| Hover Card | `@/components/ui/hover-card` |
| Input | `@/components/ui/input` |
| Input OTP | `@/components/ui/input-otp` |
| Label | `@/components/ui/label` |
| Menubar | `@/components/ui/menubar` |
| Navigation Menu | `@/components/ui/navigation-menu` |
| Pagination | `@/components/ui/pagination` |
| Popover | `@/components/ui/popover` |
| Progress | `@/components/ui/progress` |
| Radio Group | `@/components/ui/radio-group` |
| Resizable | `@/components/ui/resizable` |
| Scroll Area | `@/components/ui/scroll-area` |
| Select | `@/components/ui/select` |
| Separator | `@/components/ui/separator` |
| Sheet | `@/components/ui/sheet` |
| Sidebar | `@/components/ui/sidebar` |
| Skeleton | `@/components/ui/skeleton` |
| Slider | `@/components/ui/slider` |
| Sonner (toast) | `@/components/ui/sonner` |
| Switch | `@/components/ui/switch` |
| Table | `@/components/ui/table` |
| Tabs | `@/components/ui/tabs` |
| Textarea | `@/components/ui/textarea` |
| Toggle | `@/components/ui/toggle` |
| Toggle Group | `@/components/ui/toggle-group` |
| Tooltip | `@/components/ui/tooltip` |

## Adding or removing components

- Add: `pnpm dlx shadcn@latest add <name>`, then add its row above.
- The base color is `neutral` and colors come from semantic tokens (see
  `theme.md`), so added components match the light theme out of the box.
