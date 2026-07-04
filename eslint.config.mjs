import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import sonarjs from "eslint-plugin-sonarjs";
import vitest from "@vitest/eslint-plugin";
import comments from "@eslint-community/eslint-plugin-eslint-comments";
import bedrock from "./tools/eslint-plugin-bedrock/index.mjs";

// Files that MUST have a default export (Next.js conventions)
const NEXT_DEFAULT_EXPORT_FILES = [
  "app/**/page.tsx",
  "app/**/layout.tsx",
  "app/**/loading.tsx",
  "app/**/error.tsx",
  "app/**/global-error.tsx",
  "app/**/not-found.tsx",
  "app/**/template.tsx",
  "app/**/default.tsx",
  "app/**/route.ts",
  "app/**/manifest.ts",
  "app/**/opengraph-image.tsx",
  "app/**/twitter-image.tsx",
  "app/**/robots.ts",
  "app/**/sitemap.ts",
  "middleware.ts",
  "next.config.*",
  "postcss.config.*",
  "tailwind.config.*",
];

export default tseslint.config(
  // ── Ignores ─────────────────────────────────────────────────────────────────
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    // ESLint flat config ignores nothing by default, so build output must be
    // listed explicitly or `eslint .` lints it.
    "**/dist/**",
    "coverage/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  // ── Linter options ──────────────────────────────────────────────────────────
  // Surfaces stale `// eslint-disable-...` directives so the AI can't leave
  // dormant exemptions in the codebase after the underlying issue is fixed.
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },

  // ── Next.js base ─────────────────────────────────────────────────────────────
  ...nextVitals,
  ...nextTs,

  // ── TypeScript strict type-aware ─────────────────────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ── Main rules ───────────────────────────────────────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      bedrock,
      "import-x": importX,
      sonarjs,
      "@eslint-community/eslint-comments": comments,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── TypeScript: no unsafe ──────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      // ── TypeScript: no shortcuts that bypass types ─────────────────────────
      "@typescript-eslint/no-non-null-assertion": "error",     // interdit le !
      "@typescript-eslint/no-unnecessary-condition": "error",  // code mort

      // ── TypeScript: async/await ────────────────────────────────────────────
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // ── TypeScript: exhaustivité & cohérence ───────────────────────────────
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": "error",

      // ── TypeScript: préférer les opérateurs modernes ───────────────────────
      "@typescript-eslint/prefer-nullish-coalescing": "error", // ?? au lieu de ||
      "@typescript-eslint/prefer-optional-chain": "error",     // ?. au lieu de &&

      // ── TypeScript: ts-comment avec description obligatoire ────────────────
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,       // toujours interdit
          "ts-nocheck": true,      // toujours interdit
          minimumDescriptionLength: 10,
        },
      ],

      // Symmetry with ban-ts-comment: every eslint-disable escape hatch must
      // carry a `-- reason`, so the AI cannot silently suppress a rule without
      // justifying it. `eslint-enable` is exempt (the matching disable holds
      // the reason). reportUnusedDisableDirectives above already kills stale ones.
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: ["eslint-enable"] },
      ],

      // ── Imports ────────────────────────────────────────────────────────────
      "import-x/no-cycle": "error",              // pas de dépendances circulaires
      "import-x/no-duplicates": "error",         // pas d'imports dupliqués
      "import-x/no-relative-parent-imports": "error", // pas de ../../, forcer @/
      "import-x/no-default-export": "error",     // pas de export default (sauf Next)
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", ["internal", "parent", "sibling", "index"]],
          pathGroups: [
            { pattern: "@/components/**", group: "internal", position: "before" },
            { pattern: "@/features/**",   group: "internal", position: "before" },
            { pattern: "@/lib/**",        group: "internal", position: "before" },
            { pattern: "@/types/**",      group: "internal", position: "before" },
          ],
          pathGroupsExcludedImportTypes: ["builtin", "external"],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],

      // ── Cross-route boundary enforcement ───────────────────────────────────
      // (Stock `no-restricted-imports` cannot tell same-route from cross-route,
      //  so the project uses `bedrock/no-cross-route-private-imports` below.)
      "bedrock/forms-must-use-zod": "error",
      "bedrock/no-code-without-mono-font": "error",
      "bedrock/no-cross-route-private-imports": "error",
      "bedrock/no-cross-feature-ui-imports": "error",
      "bedrock/no-feature-domain-imports-from-app-or-components": "error",
      "bedrock/no-feature-root-support-files": "error",
      "bedrock/no-filter-invert": "error",
      "bedrock/no-faux-alert-containers": "error",
      "bedrock/no-faux-badge-containers": "error",
      "bedrock/no-faux-card-containers": "error",
      "bedrock/no-heading-without-display-font": "error",
      "bedrock/no-internal-link-anchor": "error",
      "bedrock/no-lib-imports-from-features": "error",
      "bedrock/no-lucide-react-imports": "error",
      "bedrock/no-parent-relative-imports": "error",
      "bedrock/no-raw-color-literals": "error",
      "bedrock/no-raw-jsx-primitives": "error",
      "bedrock/no-raw-tailwind-colors": "error",
      "bedrock/no-shared-imports-from-features": "error",
      "bedrock/no-support-files-in-component-role-folders": "error",
      "bedrock/no-throw-new-error-in-server": "error",
      "bedrock/no-unclassified-route-support-file": "error",
      "bedrock/no-unclassified-component-role": "error",
      "bedrock/no-unstable-keys": "error",
      "bedrock/one-component-per-file": "error",
      "bedrock/max-component-props": "error",
      "bedrock/route-handler-must-use-logger": "error",
      "bedrock/zustand-require-selector": "error",
      "bedrock/presenter-no-formatting": "error",

      // ── File size discipline ───────────────────────────────────────────────
      // 250 lines is generous; the goal is to flag dumping grounds before they
      // calcify, not to micro-manage. Tweak per-folder overrides below.
      "max-lines": [
        "error",
        { max: 250, skipBlankLines: true, skipComments: true },
      ],

      // ── Console ────────────────────────────────────────────────────────────
      "no-console": ["error", { allow: ["warn", "error"] }],

      // ── SonarJS: qualité du code ───────────────────────────────────────────
      "sonarjs/no-duplicate-string": ["error", { threshold: 4 }],
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-functions": "error",
    },
  },

  {
    files: [
      "**/use*.ts",
      "**/use*.tsx",
      "**/hooks/**/*.ts",
      "**/hooks/**/*.tsx",
    ],
    rules: {
      "bedrock/hook-no-jsx": "error",
    },
  },

  {
    files: [
      "app/**/_components/**/presenters/**/*.tsx",
      "features/**/components/**/presenters/**/*.tsx",
      "components/shared/**/presenters/**/*.tsx",
    ],
    rules: {
      "bedrock/presenter-no-side-effects": "error",
      "bedrock/presenter-no-smart-imports": "error",
      "bedrock/presenter-no-smart-react-hooks": "error",
    },
  },

  {
    files: [
      "app/**/_components/**/orchestrators/**/*.tsx",
      "features/**/components/**/orchestrators/**/*.tsx",
      "components/shared/**/orchestrators/**/*.tsx",
    ],
    rules: {
      "bedrock/orchestrator-must-orchestrate": "error",
      "bedrock/orchestrator-no-direct-fetch": "error",
    },
  },

  // ── shadcn/ui generated components — relax code-quality rules ────────────────
  {
    // Vendored shadcn/ui primitives and their generated hooks. These are copied
    // verbatim from the shadcn registry and updated via its CLI, so they are held
    // to shadcn's conventions (lucide icons, its import order, its effect
    // patterns) rather than this project's authored-code guardrails. Everything
    // YOU write is still fully governed. See .agents/rules/ui-components.md.
    files: ["components/ui/**/*.ts", "components/ui/**/*.tsx", "hooks/**/*.ts", "hooks/**/*.tsx"],
    rules: {
      "bedrock/no-code-without-mono-font": "off",
      "bedrock/no-faux-badge-containers": "off",
      "bedrock/no-faux-card-containers": "off",
      "bedrock/no-faux-alert-containers": "off",
      "bedrock/no-feature-domain-imports-from-app-or-components": "off",
      "bedrock/no-feature-root-support-files": "off",
      "bedrock/no-heading-without-display-font": "off",
      "bedrock/no-lucide-react-imports": "off",
      "bedrock/no-raw-color-literals": "off",
      "bedrock/no-raw-jsx-primitives": "off",
      "bedrock/no-raw-tailwind-colors": "off",
      "bedrock/no-shared-imports-from-features": "off",
      "bedrock/no-support-files-in-component-role-folders": "off",
      "bedrock/no-unclassified-route-support-file": "off",
      "bedrock/no-unclassified-component-role": "off",
      "bedrock/no-unstable-keys": "off",
      "bedrock/one-component-per-file": "off",
      "bedrock/max-component-props": "off",
      "bedrock/presenter-no-formatting": "off",
      "import-x/order": "off",
      "max-lines": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/cognitive-complexity": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-unnecessary-template-expression": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },

  {
    files: ["**/*.test.*", "**/*.spec.*"],
    plugins: { vitest },
    rules: {
      // A committed `.only` makes Vitest run that one test while CI stays green,
      // silently disabling every other file. `fixable: false` → loud failure,
      // not a silent `--fix` erase. `.skip`/`xit`/`.todo` must not be parked.
      "vitest/no-focused-tests": ["error", { fixable: false }],
      "vitest/no-disabled-tests": "error",

      "bedrock/forms-must-use-zod": "off",
      "bedrock/no-code-without-mono-font": "off",
      "bedrock/no-cross-feature-ui-imports": "off",
      "bedrock/no-feature-domain-imports-from-app-or-components": "off",
      "bedrock/no-feature-root-support-files": "off",
      "bedrock/no-faux-alert-containers": "off",
      "bedrock/no-faux-badge-containers": "off",
      "bedrock/no-faux-card-containers": "off",
      "bedrock/no-heading-without-display-font": "off",
      "bedrock/no-internal-link-anchor": "off",
      "bedrock/no-lib-imports-from-features": "off",
      "bedrock/no-lucide-react-imports": "off",
      "bedrock/no-parent-relative-imports": "off",
      "bedrock/no-raw-color-literals": "off",
      "bedrock/no-raw-jsx-primitives": "off",
      "bedrock/no-raw-tailwind-colors": "off",
      "bedrock/no-support-files-in-component-role-folders": "off",
      "bedrock/no-throw-new-error-in-server": "off",
      "bedrock/no-unclassified-route-support-file": "off",
      "bedrock/no-unclassified-component-role": "off",
      "bedrock/no-unstable-keys": "off",
      "bedrock/one-component-per-file": "off",
      "bedrock/max-component-props": "off",
      "bedrock/orchestrator-no-direct-fetch": "off",
      "bedrock/presenter-no-formatting": "off",
      "bedrock/presenter-no-side-effects": "off",
      "bedrock/presenter-no-smart-imports": "off",
      "bedrock/presenter-no-smart-react-hooks": "off",
      "bedrock/route-handler-must-use-logger": "off",
      "bedrock/zustand-require-selector": "off",
      "bedrock/hook-no-jsx": "off",
      "max-lines": "off",
    },
  },

  // ── Zustand stores: UI state only, never server data ────────────────────────
  // Stores hold client UI state; server data lives in TanStack Query. The
  // `@/features/*/types` tripwire flags server-shaped payloads leaking into
  // store state.
  {
    files: [
      "**/lib/stores/**",
      "**/*Store.ts",
      "**/lib/store.ts",
      "**/stores/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/types"],
              message:
                "Importing a feature's server types into a store usually means server data is leaking into UI state. Hold that data in a TanStack query instead. See .agents/rules/state.md#stores.",
            },
          ],
        },
      ],
    },
  },

  // ── Exceptions pour les fichiers spéciaux Next.js ───────────────────────────
  {
    files: NEXT_DEFAULT_EXPORT_FILES,
    rules: {
      "import-x/no-default-export": "off",
    },
  },

  {
    files: ["knip.ts"],
    rules: {
      "import-x/no-default-export": "off",
    },
  },

  // ── Config files (mjs/cjs) — moins strict ────────────────────────────────────
  {
    files: ["**/*.mjs", "**/*.cjs", "**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
