import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { afterAll, describe, it } from "vitest";

import bedrock from "./index.mjs";

// Wire ESLint's RuleTester into Vitest. Without this, RuleTester falls back to
// running all cases inside the parent `it(...)` and reports "the test failed"
// instead of "case #4 failed", which makes regressions painful to diagnose.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const tsx = {
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
};

// Use the live cwd so tests work both locally and on CI (where the repo lives
// under a different absolute path).
// Rules that resolve filenames against the cwd will get a matching base.
const cwdRoot = process.cwd();
function presenterFilename(name = "Foo.tsx") {
  return `${cwdRoot}/features/x/components/presenters/${name}`;
}
function orchestratorFilename(name = "Foo.tsx") {
  return `${cwdRoot}/features/x/components/orchestrators/${name}`;
}
function libRootFilename(name = "foo.ts") {
  return `${cwdRoot}/lib/${name}`;
}
function featureLibFilename(name = "foo.ts") {
  return `${cwdRoot}/features/x/lib/${name}`;
}
function sharedComponentFilename(name = "Foo.tsx") {
  return `${cwdRoot}/components/shared/profile/presenters/${name}`;
}

const tester = new RuleTester(tsx);

describe("bedrock/presenter-no-formatting", () => {
    tester.run("presenter-no-formatting", bedrock.rules["presenter-no-formatting"], {
      valid: [
        {
          // Plain JSX rendering pre-formatted props is OK.
          filename: presenterFilename(),
          code: `export function Foo({ label }: { label: string }) { return <span>{label}</span>; }`,
        },
        {
          // Outside presenter folders the rule is silent.
          filename: `${cwdRoot}/features/x/lib/util.ts`,
          code: `export function f(d: Date) { return d.toLocaleDateString(); }`,
        },
      ],
      invalid: [
        {
          filename: presenterFilename(),
          code: `function fmt(d: Date) { return d.toLocaleDateString(); }
export function Foo({ d }: { d: Date }) { return <span>{fmt(d)}</span>; }`,
          errors: [{ messageId: "methodCall" }],
        },
        {
          filename: presenterFilename(),
          code: `const fmt = new Intl.DateTimeFormat("en-US");
export function Foo({ d }: { d: Date }) { return <span>{fmt.format(d)}</span>; }`,
          errors: [
            { messageId: "intlCtor" },
            { messageId: "methodCall" },
          ],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo({ d }: { d: string }) { return <time>{new Date(d).toString()}</time>; }`,
          errors: [{ messageId: "newExpression" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo({ v }: { v: string }) { return <span>{Number(v)}</span>; }`,
          errors: [{ messageId: "freeCall" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo({ items }: { items: number[] }) { return <ul>{items.filter(n => n > 0).map(n => <li key={n}>{n}</li>)}</ul>; }`,
          errors: [{ messageId: "arrayTransformInJsx" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo({ s }: { s: string }) { return <span>{s === "a" ? "A" : s === "b" ? "B" : "C"}</span>; }`,
          errors: [{ messageId: "nestedTernary" }],
        },
      ],
    });
});

describe("bedrock/no-raw-color-literals", () => {
    tester.run("no-raw-color-literals", bedrock.rules["no-raw-color-literals"], {
      valid: [
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <svg><circle fill="currentColor" /></svg>; }`,
        },
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <div style={{ color: "var(--color-foreground)" }} />; }`,
        },
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <svg fill="var(--color-primary)" />; }`,
        },
      ],
      invalid: [
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <svg fill="white" />; }`,
          errors: [{ messageId: "attribute" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <svg fill="#84CC16" />; }`,
          errors: [{ messageId: "attribute" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <div style={{ color: "#fff" }} />; }`,
          errors: [{ messageId: "style" }],
        },
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <div style={{ background: "rgba(132,204,22,0.5)" }} />; }`,
          errors: [{ messageId: "style" }],
        },
        {
          // backgroundImage was previously a blind spot — confirm it's caught now.
          filename: presenterFilename(),
          code: `export function Foo() { return <div style={{ backgroundImage: "linear-gradient(rgba(255,0,0,0.1), transparent)" }} />; }`,
          errors: [{ messageId: "style" }],
        },
      ],
    });
});

describe("bedrock/no-parent-relative-imports", () => {
    tester.run("no-parent-relative-imports", bedrock.rules["no-parent-relative-imports"], {
      valid: [
        {
          filename: `${cwdRoot}/features/x/components/presenters/Foo.tsx`,
          code: `import { Bar } from "@/features/x/lib/bar";`,
        },
        {
          filename: `${cwdRoot}/features/x/components/presenters/Foo.tsx`,
          code: `import { Bar } from "./Bar";`,
        },
      ],
      invalid: [
        {
          // From `features/x/components/presenters/`, `../lib/bar` resolves to
          // `features/x/components/lib/bar` (one level up = `components/`).
          filename: `${cwdRoot}/features/x/components/presenters/Foo.tsx`,
          code: `import { Bar } from "../lib/bar";`,
          output: `import { Bar } from "@/features/x/components/lib/bar";`,
          errors: [{ messageId: "forbidden" }],
        },
        {
          // Two levels up takes us to `features/x/`.
          filename: `${cwdRoot}/features/x/components/presenters/Foo.tsx`,
          code: `import { Bar } from "../../types";`,
          output: `import { Bar } from "@/features/x/types";`,
          errors: [{ messageId: "forbidden" }],
        },
      ],
    });
});

describe("bedrock/no-lib-imports-from-features", () => {
    tester.run("no-lib-imports-from-features", bedrock.rules["no-lib-imports-from-features"], {
      valid: [
        {
          // feature-internal lib/ is allowed to know about its own feature
          filename: featureLibFilename(),
          code: `import type { Foo } from "@/features/x/types";`,
        },
        {
          // top-level lib/ importing from itself is fine
          filename: libRootFilename(),
          code: `import { x } from "@/lib/utils";`,
        },
      ],
      invalid: [
        {
          filename: libRootFilename("grading/local.ts"),
          code: `import type { SubmittedFile } from "@/features/grading/types";`,
          errors: [{ messageId: "forbidden" }],
        },
        {
          filename: libRootFilename("grading/local.ts"),
          code: `export type { SubmittedFile } from "@/features/grading/types";`,
          errors: [{ messageId: "forbidden" }],
        },
      ],
    });
});

describe("bedrock/no-shared-imports-from-features", () => {
    tester.run("no-shared-imports-from-features", bedrock.rules["no-shared-imports-from-features"], {
      valid: [
        {
          filename: sharedComponentFilename(),
          code: `import { Button } from "@/components/ui/button";\nimport type { AppChromeProfile } from "@/types/app-chrome";`,
        },
        {
          // Feature files importing their own feature are handled by other rules.
          filename: presenterFilename(),
          code: `import { Foo } from "@/features/x/components/presenters/Foo";`,
        },
      ],
      invalid: [
        {
          filename: sharedComponentFilename(),
          code: `import { useProfile } from "@/features/profile/hooks/useProfile";`,
          errors: [{ messageId: "forbidden" }],
        },
        {
          filename: sharedComponentFilename(),
          code: `import type { Profile } from "@/features/profile/types";`,
          errors: [{ messageId: "forbidden" }],
        },
      ],
    });
});

describe("bedrock/route-handler-must-use-logger", () => {
    tester.run("route-handler-must-use-logger", bedrock.rules["route-handler-must-use-logger"], {
      valid: [
        {
          filename: `${cwdRoot}/app/api/foo/route.ts`,
          code: `import { withEvlog } from "@/lib/evlog";\nexport const GET = withEvlog(async () => new Response());`,
        },
        {
          // Files outside app/api/**/route.ts are not in scope.
          filename: `${cwdRoot}/features/x/actions.ts`,
          code: `export const GET = async () => new Response();`,
        },
      ],
      invalid: [
        {
          filename: `${cwdRoot}/app/api/foo/route.ts`,
          code: `export const GET = async () => new Response();`,
          errors: [{ messageId: "missingWrapper" }],
        },
        {
          filename: `${cwdRoot}/app/api/foo/route.ts`,
          code: `export const POST = async () => new Response(); export const DELETE = async () => new Response();`,
          errors: [
            { messageId: "missingWrapper" },
            { messageId: "missingWrapper" },
          ],
        },
      ],
    });
});

describe("bedrock/no-throw-new-error-in-server", () => {
    tester.run("no-throw-new-error-in-server", bedrock.rules["no-throw-new-error-in-server"], {
      valid: [
        {
          filename: `${cwdRoot}/features/x/lib/util.ts`,
          code: `export function f() { throw new Error("ok in plain lib"); }`,
        },
        {
          filename: `${cwdRoot}/app/api/foo/route.ts`,
          code: `import { createError } from "@/lib/evlog";\nexport function f() { throw createError({ status: 400, message: "x", why: "y", fix: "z" }); }`,
        },
      ],
      invalid: [
        {
          filename: `${cwdRoot}/app/api/foo/route.ts`,
          code: `export function f() { throw new Error("nope"); }`,
          errors: [{ messageId: "forbidden" }],
        },
        {
          filename: `${cwdRoot}/features/x/actions.ts`,
          code: `export function f() { throw new Error("nope"); }`,
          errors: [{ messageId: "forbidden" }],
        },
      ],
    });
});

describe("bedrock/zustand-require-selector", () => {
    tester.run("zustand-require-selector", bedrock.rules["zustand-require-selector"], {
      valid: [
        {
          filename: presenterFilename(),
          code: `import { useUIStore } from "@/lib/stores/ui";\nfunction f() { return useUIStore((s) => s.x); }`,
        },
      ],
      invalid: [
        {
          filename: orchestratorFilename(),
          code: `import { useUIStore } from "@/lib/stores/ui";\nfunction f() { return useUIStore(); }`,
          errors: [{ messageId: "missingSelector" }],
        },
      ],
    });
});

describe("bedrock/forms-must-use-zod", () => {
    tester.run("forms-must-use-zod", bedrock.rules["forms-must-use-zod"], {
      valid: [
        {
          filename: orchestratorFilename(),
          code: `import { useForm } from "react-hook-form";\nimport { zodResolver } from "@hookform/resolvers/zod";\nimport { z } from "zod";\nconst schema = z.object({});\nfunction F() { useForm({ resolver: zodResolver(schema) }); }`,
        },
      ],
      invalid: [
        {
          filename: orchestratorFilename(),
          code: `import { useForm } from "react-hook-form";\nfunction F() { useForm(); }`,
          errors: [{ messageId: "missingZod" }],
        },
        {
          filename: orchestratorFilename(),
          code: `import { useForm } from "react-hook-form";\nfunction F() { useForm({ defaultValues: { x: 1 } }); }`,
          errors: [{ messageId: "missingZod" }],
        },
      ],
    });
});

describe("bedrock/no-internal-link-anchor", () => {
    tester.run("no-internal-link-anchor", bedrock.rules["no-internal-link-anchor"], {
      valid: [
        // External literal URLs are allowed.
        { filename: presenterFilename(), code: `export function F() { return <a href="https://example.com">x</a>; }` },
        { filename: presenterFilename(), code: `export function F() { return <a href="mailto:a@b.c">x</a>; }` },
        { filename: presenterFilename(), code: `export function F() { return <a href="#anchor">x</a>; }` },
        // Anchors with no href fall through (browser default behavior).
        { filename: presenterFilename(), code: `export function F() { return <a>x</a>; }` },
      ],
      invalid: [
        {
          filename: presenterFilename(),
          code: `export function F() { return <a href="/about">x</a>; }`,
          errors: [{ messageId: "anchor" }],
        },
        {
          // Dynamic href used to slip through — now caught.
          filename: presenterFilename(),
          code: `export function F({ url }: { url: string }) { return <a href={url}>x</a>; }`,
          errors: [{ messageId: "anchor" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ id }: { id: string }) { return <a href={\`/users/\${id}\`}>x</a>; }`,
          errors: [{ messageId: "anchor" }],
        },
      ],
    });
});

describe("bedrock/no-cross-route-private-imports", () => {
    tester.run("no-cross-route-private-imports", bedrock.rules["no-cross-route-private-imports"], {
      valid: [
        {
          // Same route — allowed.
          filename: `${cwdRoot}/app/(dashboard)/profile/_components/foo/orchestrators/Bar.tsx`,
          code: `import { Baz } from "@/app/(dashboard)/profile/_components/foo/presenters/Baz";`,
        },
        {
          // Importing from features/ — not in scope of this rule.
          filename: `${cwdRoot}/app/(dashboard)/profile/_components/foo/orchestrators/Bar.tsx`,
          code: `import { Baz } from "@/features/x/types";`,
        },
      ],
      invalid: [
        {
          filename: `${cwdRoot}/app/(dashboard)/dashboard/page.tsx`,
          code: `import { Baz } from "@/app/(dashboard)/profile/_components/foo/presenters/Baz";`,
          errors: [{ messageId: "forbidden" }],
        },
        {
          filename: `${cwdRoot}/features/x/lib/foo.ts`,
          code: `import { handler } from "@/app/(dashboard)/profile/_actions/foo";`,
          errors: [{ messageId: "forbidden" }],
        },
      ],
    });
});

describe("bedrock/no-unstable-keys", () => {
    tester.run("no-unstable-keys", bedrock.rules["no-unstable-keys"], {
      valid: [
        // Stable identifiers — the canonical correct usage.
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: { id: string }[] }) { return <ul>{items.map((item) => <li key={item.id} />)}</ul>; }`,
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: { slug: string }[] }) { return <ul>{items.map((item) => <li key={\`exam-\${item.slug}\`} />)}</ul>; }`,
        },
        // Composite key from item fields is fine.
        {
          filename: presenterFilename(),
          code: `export function F({ rows }: { rows: { rank: number; username: string }[] }) { return <>{rows.map((r) => <div key={\`\${r.rank}-\${r.username}\`} />)}</>; }`,
        },
        // No key attribute at all — out of scope (other rules / React itself catches missing keys).
        {
          filename: presenterFilename(),
          code: `export function F() { return <span>x</span>; }`,
        },
      ],
      invalid: [
        // Bare index identifiers.
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "bareIndex" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, index) => <li key={index}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "bareIndex" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, idx) => <li key={idx}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "bareIndex" }],
        },
        // Template literal that only embeds the index — same bug, different disguise.
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, i) => <li key={\`row-\${i}\`}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "indexInTemplate" }],
        },
        // Wrappers around the index.
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, i) => <li key={String(i)}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "bareIndex" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s, i) => <li key={i + 1}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "bareIndex" }],
        },
        // Non-deterministic calls — these remount the subtree on every render.
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s) => <li key={Math.random()}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "nonDeterministic" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s) => <li key={Date.now()}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "nonDeterministic" }],
        },
        {
          filename: presenterFilename(),
          code: `export function F({ items }: { items: string[] }) { return <ul>{items.map((s) => <li key={crypto.randomUUID()}>{s}</li>)}</ul>; }`,
          errors: [{ messageId: "nonDeterministic" }],
        },
      ],
    });
});

describe("bedrock/one-component-per-file", () => {
    tester.run("one-component-per-file", bedrock.rules["one-component-per-file"], {
      valid: [
        {
          filename: presenterFilename(),
          code: `export function Foo() { return <span />; }`,
        },
        {
          // Lowercase helpers don't count as components.
          filename: presenterFilename(),
          code: `function fmt(s: string) { return s.toUpperCase(); } export function Foo({ s }: { s: string }) { return <span>{fmt(s)}</span>; }`,
        },
      ],
      invalid: [
        {
          filename: presenterFilename(),
          code: `function Bar() { return <span />; } export function Foo() { return <Bar />; }`,
          errors: [{ messageId: "tooMany" }],
        },
      ],
    });
});

describe("bedrock/no-unclassified-component-role", () => {
    tester.run("no-unclassified-component-role", bedrock.rules["no-unclassified-component-role"], {
      valid: [
        {
          // Role folder directly under components/ is the canonical shape.
          filename: `${cwdRoot}/features/x/components/presenters/Card.tsx`,
          code: `export function Card() { return null; }`,
        },
        {
          filename: `${cwdRoot}/features/x/components/orchestrators/Card.tsx`,
          code: `export function Card() { return null; }`,
        },
        {
          // A subject level BEFORE components/ is allowed (larger features).
          filename: `${cwdRoot}/features/x/panel/components/presenters/Card.tsx`,
          code: `export function Card() { return null; }`,
        },
      ],
      invalid: [
        {
          // An extra folder between components/ and the role folder is rejected.
          filename: `${cwdRoot}/features/x/components/Card/presenters/Card.tsx`,
          code: `export function Card() { return null; }`,
          errors: [{ messageId: "unclassified" }],
        },
        {
          // A component dropped straight into components/ with no role folder.
          filename: `${cwdRoot}/features/x/components/Card.tsx`,
          code: `export function Card() { return null; }`,
          errors: [{ messageId: "unclassified" }],
        },
      ],
    });
});

describe("bedrock/max-component-props", () => {
    tester.run("max-component-props", bedrock.rules["max-component-props"], {
      valid: [
        {
          // Six props is at the limit, allowed.
          filename: presenterFilename(),
          code: `export function Foo({ a, b, c, d, e, f }: Record<string, string>) { return <span>{a}{b}{c}{d}{e}{f}</span>; }`,
        },
        {
          // A cohesive object prop keeps the count low.
          filename: presenterFilename(),
          code: `export function Foo({ data }: { data: { a: string; b: string } }) { return <span>{data.a}</span>; }`,
        },
        {
          // Lowercase helpers are not components; their params are not counted.
          filename: presenterFilename(),
          code: `function build({ a, b, c, d, e, f, g }: Record<string, string>) { return a + b + c + d + e + f + g; } export function Foo() { return <span>{build({ a: "", b: "", c: "", d: "", e: "", f: "", g: "" })}</span>; }`,
        },
      ],
      invalid: [
        {
          // Seven separate props: group them or compose with slots.
          filename: presenterFilename(),
          code: `export function Foo({ a, b, c, d, e, f, g }: Record<string, string>) { return <span>{a}</span>; }`,
          errors: [{ messageId: "tooMany" }],
        },
      ],
    });
});
