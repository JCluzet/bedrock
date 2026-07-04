import path from "node:path";

const ARCHITECTURE_RULE_PATH = ".agents/rules/architecture.md";
const COMPONENTS_RULE_PATH = ".agents/rules/components.md";
const STRUCTURE_RULE_PATH = ".agents/rules/structure.md";
const THEME_RULE_PATH = ".agents/rules/theme.md";
const UI_COMPONENTS_RULE_PATH = ".agents/rules/ui-components.md";
const LOGGING_RULE_PATH = ".agents/rules/logging.md";
const STATE_RULE_PATH = ".agents/rules/state.md";

const RAW_JSX_PRIMITIVES = new Map([
  ["a", `Use \`next/link\` for internal navigation instead of a raw \`<a>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["button", `Use the shared \`Button\` primitive instead of a raw \`<button>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["dialog", `Use the shared dialog primitives instead of a raw \`<dialog>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["form", `Use the approved form abstraction instead of a raw \`<form>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["hr", `Use the shared \`Separator\` primitive instead of a raw \`<hr>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["img", `Use \`next/image\` instead of a raw \`<img>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["input", `Use the shared \`Input\` primitive instead of a raw \`<input>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["script", `Use \`next/script\` instead of a raw \`<script>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["select", `Use the shared \`Select\` primitive instead of a raw \`<select>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["table", `Use the shared \`Table\` primitives instead of a raw \`<table>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
  ["textarea", `Use the shared \`Textarea\` primitive instead of a raw \`<textarea>\`. Rule: ${UI_COMPONENTS_RULE_PATH}`],
]);

// Raw palette colors with optional shade and optional opacity modifier.
// Catches: bg-white, text-emerald-500, bg-white/55, text-black/[0.6], border-zinc-700/40.
const RAW_TAILWIND_COLOR_PATTERN =
  /(?:^|:)(?:bg|text|border|ring|fill|stroke|outline|divide|placeholder|caret|accent|decoration|shadow|from|to|via)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/(?:\d{1,3}|\[[^\]]+\]))?$/;

// Arbitrary color values: bg-[#84CC16], text-[hsl(120,50%,50%)], border-[rgb(...)],
// fill-[rgba(...)], from-[#abc], etc. Only flags arbitrary VALUES that look like colors.
const ARBITRARY_COLOR_VALUE_PATTERN =
  /(?:^|:)(?:bg|text|border|ring|fill|stroke|outline|divide|placeholder|caret|accent|decoration|shadow|from|to|via)-\[(?:#[0-9a-fA-F]{3,8}(?:\/[\d.]+)?|rgba?\([^\]]+\)|hsla?\([^\]]+\)|oklch\([^\]]+\)|color\([^\]]+\))\]$/;

const CARD_SURFACE_TOKENS = ["bg-card", "bg-popover", "bg-surface", "bg-surface-raised"];
const BADGE_SURFACE_TOKENS = ["bg-primary", "bg-secondary", "bg-muted", "bg-destructive"];
const ALERT_TOKENS = ["bg-destructive", "text-destructive", "border-destructive"];

function getAttribute(node, attributeName) {
  return node.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === attributeName,
  );
}

function getLiteralStringAttributeValue(attribute) {
  if (!attribute || attribute.type !== "JSXAttribute") {
    return null;
  }

  if (!attribute.value) {
    return "";
  }

  if (attribute.value.type === "Literal" && typeof attribute.value.value === "string") {
    return attribute.value.value;
  }

  return null;
}

function hasAttribute(node, attributeName) {
  return Boolean(getAttribute(node, attributeName));
}

function getJsxName(node) {
  if (!node.name || node.name.type !== "JSXIdentifier") {
    return null;
  }

  return node.name.name;
}

function getFeatureName(filename) {
  const normalized = normalizeFilename(filename);
  const match = normalized.match(/\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

function isFeatureComponentFile(filename) {
  const normalized = normalizeFilename(filename);
  return /\/features\/[^/]+\/(?:.+\/)?components\//.test(normalized);
}

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isRouteComponentFile(filename) {
  return /\/app\/(?:.*\/)?_components\/.*\.tsx$/.test(filename);
}

function isSharedComponentFile(filename) {
  return /\/components\/shared\/.*\.tsx$/.test(filename);
}

function isAnyComponentContainerFile(filename) {
  return (
    isRouteComponentFile(filename) ||
    isFeatureComponentFile(filename) ||
    isSharedComponentFile(filename)
  );
}

function isComponentTsxFile(filename) {
  return isAnyComponentContainerFile(filename) && filename.endsWith(".tsx");
}

function isNonTestTypeScriptFile(filename) {
  return filename.endsWith(".ts") && !filename.endsWith(".d.ts");
}

function isPresenterFile(filename) {
  return (
    /\/app\/(?:.*\/)?_components\/.+\/presenters\/.*\.tsx$/.test(filename) ||
    /\/features\/[^/]+\/(?:.+\/)?components\/presenters\/.*\.tsx$/.test(filename) ||
    /\/components\/shared\/.+\/presenters\/.*\.tsx$/.test(filename)
  );
}

function isOrchestratorFile(filename) {
  return (
    /\/app\/(?:.*\/)?_components\/.+\/orchestrators\/.*\.tsx$/.test(filename) ||
    /\/features\/[^/]+\/(?:.+\/)?components\/orchestrators\/.*\.tsx$/.test(filename) ||
    /\/components\/shared\/.+\/orchestrators\/.*\.tsx$/.test(filename)
  );
}

function isComponentRoleSupportFile(filename) {
  if (!isNonTestTypeScriptFile(filename)) {
    return false;
  }

  return (
    /\/app\/(?:.*\/)?_components\/.+\/(?:presenters|orchestrators)\//.test(filename) ||
    /\/features\/[^/]+\/(?:.+\/)?components\/(?:presenters|orchestrators)\//.test(filename) ||
    /\/components\/shared\/.+\/(?:presenters|orchestrators)\//.test(filename)
  );
}

function isUnclassifiedComponentFile(filename) {
  if (!isComponentTsxFile(filename)) {
    return false;
  }

  return !isPresenterFile(filename) && !isOrchestratorFile(filename);
}

function isRoutePrivateSupportRootFile(filename) {
  return (
    /\/app\/.*\/_(?:hooks|lib)\/[^/]+\.[cm]?[jt]sx?$/.test(filename) &&
    !/\.(test|spec)\.[cm]?[jt]sx?$/.test(filename)
  );
}

function isFeatureRootSupportFile(filename) {
  if (!/\/features\/[^/]+\/[^/]+\.[cm]?[jt]sx?$/.test(filename)) {
    return false;
  }

  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(filename)) {
    return false;
  }

  const basename = path.posix.basename(filename);
  return !["actions.ts", "provider.ts", "schemas.ts", "types.ts"].includes(basename);
}

function isHookFile(filename) {
  return /\/hooks\/.*\.[cm]?[jt]sx?$/.test(filename) || /\/use[A-Z][^/]*\.[cm]?[jt]sx?$/.test(filename);
}

function getForbiddenPresenterImportMessage(source) {
  return `Presenter components must only render props and emit callbacks. \`${source}\` introduces smart orchestration. Move that dependency to an orchestrator or hook instead. Rule: ${COMPONENTS_RULE_PATH}`;
}

// Sources whose mere presence makes a presenter "smart". Note: app/.../_lib/
// is intentionally NOT here — it commonly hosts the types/formatters a
// presenter needs from its sibling route. Smart pieces of a route live in
// _hooks/ and _actions/ (and the orchestrator side of _components/), which
// ARE listed.
const FORBIDDEN_PRESENTER_IMPORT_PATTERNS = [
  /^next\/navigation$/,
  /^@tanstack\/react-query(?:\/.*)?$/,
  /^@\/app\/(?:.+\/)?_hooks\//,
  /^@\/app\/(?:.+\/)?_actions\//,
  /^@\/app\/(?:.+\/)?_components\/(?:.+\/)?orchestrators\//,
  /^@\/features\/[^/]+\/(?:.+\/)?hooks\//,
  /^@\/features\/[^/]+\/providers\//,
  /^@\/features\/[^/]+\/gates\//,
  /^@\/features\/[^/]+\/(?:.+\/)?components\/(?:.+\/)?orchestrators\//,
  /^@\/components\/shared\/.+\/orchestrators\//,
  /^@\/lib\/stores\//,
  /^sonner$/,
];

const FORBIDDEN_PRESENTER_REACT_HOOKS = new Set([
  "useActionState",
  "useDeferredValue",
  "useEffect",
  "useInsertionEffect",
  "useLayoutEffect",
  "useOptimistic",
  "useReducer",
  "useState",
  "useSyncExternalStore",
  "useTransition",
]);

function getStaticClassNameValue(attributeValue) {
  if (!attributeValue) {
    return null;
  }

  if (attributeValue.type === "Literal" && typeof attributeValue.value === "string") {
    return attributeValue.value;
  }

  if (attributeValue.type !== "JSXExpressionContainer") {
    return null;
  }

  return getStaticExpressionString(attributeValue.expression);
}

function getStaticExpressionString(expression) {
  if (!expression) {
    return null;
  }

  if (expression.type === "Literal" && typeof expression.value === "string") {
    return expression.value;
  }

  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return expression.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
  }

  if (
    expression.type === "CallExpression" &&
    expression.callee.type === "Identifier" &&
    expression.callee.name === "cn"
  ) {
    const segments = expression.arguments.flatMap((argument) => {
      const value = getStaticExpressionString(argument);
      return value ? [value] : [];
    });

    return segments.length > 0 ? segments.join(" ") : null;
  }

  return null;
}

function getClassTokens(node) {
  const classNameAttribute = getAttribute(node, "className");
  const classNameValue = classNameAttribute?.type === "JSXAttribute"
    ? getStaticClassNameValue(classNameAttribute.value)
    : null;

  return classNameValue
    ? classNameValue.split(/\s+/).map((token) => token.trim()).filter(Boolean)
    : [];
}

function hasPaddingToken(tokens) {
  return tokens.some((token) => /^p[trblxy]?-\d+/.test(token));
}

function hasBorderToken(tokens) {
  return tokens.some((token) => token === "border" || /^border-(?!0$)/.test(token));
}

function hasRoundedToken(tokens) {
  return tokens.some((token) => token.startsWith("rounded"));
}

function hasSurfaceToken(tokens, surfaces) {
  return tokens.some((token) =>
    surfaces.some((surface) => token === surface || token.startsWith(`${surface}/`))
  );
}

function hasFontToken(tokens, fontToken) {
  return tokens.includes(fontToken);
}

const noCrossFeatureUiImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow importing another feature's UI internals.",
    },
    schema: [],
    messages: {
      forbidden:
        `Do not import UI internals from another feature. Extract a shared contract/component instead. Rule: ${ARCHITECTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const currentFeature = getFeatureName(context.filename);
    if (!currentFeature) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") {
          return;
        }

        const match = node.source.value.match(/^@\/features\/([^/]+)\/components\//);
        if (!match) {
          return;
        }

        const importedFeature = match[1];
        if (importedFeature === currentFeature) {
          return;
        }

        context.report({
          node,
          messageId: "forbidden",
        });
      },
    };
  },
};

const noFeatureDomainImportsFromAppOrComponents = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep non-component feature files independent from app and shared presentation layers.",
    },
    schema: [],
    messages: {
      forbidden:
        `Non-component feature files must not import from \`@/app\` or \`@/components\`. Rule: ${ARCHITECTURE_RULE_PATH}`,
    },
  },
  create(context) {
    if (!getFeatureName(context.filename) || isFeatureComponentFile(context.filename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") {
          return;
        }

        if (!node.source.value.startsWith("@/app/") && !node.source.value.startsWith("@/components/")) {
          return;
        }

        context.report({
          node,
          messageId: "forbidden",
        });
      },
    };
  },
};

const noUnclassifiedComponentRole = {
  meta: {
    type: "problem",
    docs: {
      description: "Require every component file in component containers to live in an explicit role folder.",
    },
    schema: [],
    messages: {
      unclassified:
        `Component files must live in an explicit role folder. Use \`presenters/\` or \`orchestrators/\`, or move non-UI files to \`providers/\`, \`gates/\`, or \`hooks/\`. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isUnclassifiedComponentFile(normalizedFilename)) {
      return {};
    }

    return {
      Program(node) {
        context.report({
          node,
          messageId: "unclassified",
        });
      },
    };
  },
};

const noSupportFilesInComponentRoleFolders = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep non-component TypeScript files out of presenter and orchestrator folders.",
    },
    schema: [],
    messages: {
      support:
        `Role folders are for React components only. Move hooks to \`hooks/\`, route glue to \`_hooks/\` or \`_lib/\`, and feature helpers to \`lib/\` instead of keeping \`.ts\` files inside \`presenters/\` or \`orchestrators/\`. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isComponentRoleSupportFile(normalizedFilename)) {
      return {};
    }

    return {
      Program(node) {
        context.report({
          node,
          messageId: "support",
        });
      },
    };
  },
};

const noUnclassifiedRouteSupportFile = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep route-local hooks and support modules organized by subject.",
    },
    schema: [],
    messages: {
      support:
        `Route-private support files must be organized by subject. Move this file under \`_hooks/[subject]/\` or \`_lib/[subject]/\` instead of leaving it directly in \`_hooks/\` or \`_lib/\`. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isRoutePrivateSupportRootFile(normalizedFilename)) {
      return {};
    }

    return {
      Program(node) {
        context.report({
          node,
          messageId: "support",
        });
      },
    };
  },
};

const noFeatureRootSupportFiles = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep feature helpers in explicit folders instead of feature roots.",
    },
    schema: [],
    messages: {
      support:
        `Feature-root support files should be explicit public contracts (\`actions.ts\`, \`schemas.ts\`, \`types.ts\`, \`provider.ts\`) or live in \`lib/\`, \`hooks/\`, \`providers/\`, \`gates/\`, or a subject folder. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isFeatureRootSupportFile(normalizedFilename)) {
      return {};
    }

    return {
      Program(node) {
        context.report({
          node,
          messageId: "support",
        });
      },
    };
  },
};

const presenterNoSmartImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow smart orchestration imports inside presenter folders.",
    },
    schema: [],
    messages: {
      forbidden: "{{message}}",
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isPresenterFile(normalizedFilename)) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") {
          return;
        }

        // Type-only imports are aliases — they create no runtime coupling and
        // do not pull orchestration into the presenter's bundle. Allow them.
        if (node.importKind === "type") return;

        const source = node.source.value;
        if (!FORBIDDEN_PRESENTER_IMPORT_PATTERNS.some((pattern) => pattern.test(source))) {
          return;
        }

        // If every named specifier is itself type-only (`import { type Foo }`),
        // the declaration is effectively type-only and should pass.
        if (
          node.specifiers.length > 0 &&
          node.specifiers.every((s) => s.importKind === "type")
        ) {
          return;
        }

        context.report({
          node,
          messageId: "forbidden",
          data: {
            message: getForbiddenPresenterImportMessage(source),
          },
        });
      },
    };
  },
};

// Animation libraries whose hooks carry stateful render coupling on par with
// React's own. Including them here closes a loophole where presenters import
// `useMotionValue` / `useScroll` etc. to keep state outside react's call graph
// while still mutating client UI on every frame.
const PRESENTER_FORBIDDEN_ANIMATION_HOOK_SOURCES = new Set([
  "motion/react",
  "framer-motion",
  "motion",
]);

const ANIMATION_HOOK_NAME_PATTERN = /^use[A-Z]/;

const presenterNoSmartReactHooks = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow stateful/effect React hooks inside presenter folders.",
    },
    schema: [],
    messages: {
      forbidden:
        `Presenter components must remain dumb. \`{{hookName}}\` adds smart client state/effects. Move that behavior to an orchestrator or hook instead. Rule: ${COMPONENTS_RULE_PATH}`,
      forbiddenAnimation:
        `Presenter components must remain dumb. \`{{hookName}}\` (from \`{{source}}\`) couples a presenter to live animation state. Move it to an orchestrator or hook instead. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isPresenterFile(normalizedFilename)) {
      return {};
    }

    const reactNamespaceImports = new Set();
    const animationNamespaceImports = new Map(); // localName -> source

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") {
          return;
        }

        const isReactSource = source === "react";
        const isAnimationSource = PRESENTER_FORBIDDEN_ANIMATION_HOOK_SOURCES.has(source);
        if (!isReactSource && !isAnimationSource) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier") {
            const importedName = specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : specifier.imported.value;

            if (isReactSource && FORBIDDEN_PRESENTER_REACT_HOOKS.has(importedName)) {
              context.report({
                node: specifier,
                messageId: "forbidden",
                data: { hookName: importedName },
              });
              continue;
            }

            if (isAnimationSource && ANIMATION_HOOK_NAME_PATTERN.test(importedName)) {
              context.report({
                node: specifier,
                messageId: "forbiddenAnimation",
                data: { hookName: importedName, source },
              });
            }
            continue;
          }

          if (specifier.type === "ImportNamespaceSpecifier") {
            if (isReactSource) {
              reactNamespaceImports.add(specifier.local.name);
            } else if (isAnimationSource) {
              animationNamespaceImports.set(specifier.local.name, source);
            }
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression" || node.callee.computed) {
          return;
        }

        if (node.callee.object.type !== "Identifier") {
          return;
        }

        if (node.callee.property.type !== "Identifier") {
          return;
        }

        const objectName = node.callee.object.name;
        const hookName = node.callee.property.name;

        if (reactNamespaceImports.has(objectName)) {
          if (FORBIDDEN_PRESENTER_REACT_HOOKS.has(hookName)) {
            context.report({
              node,
              messageId: "forbidden",
              data: { hookName },
            });
          }
          return;
        }

        if (animationNamespaceImports.has(objectName)) {
          if (ANIMATION_HOOK_NAME_PATTERN.test(hookName)) {
            context.report({
              node,
              messageId: "forbiddenAnimation",
              data: { hookName, source: animationNamespaceImports.get(objectName) },
            });
          }
        }
      },
    };
  },
};

function isFetchCall(node) {
  if (node.callee.type === "Identifier" && node.callee.name === "fetch") {
    return true;
  }

  if (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object.type === "Identifier" &&
    ["globalThis", "window"].includes(node.callee.object.name) &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "fetch"
  ) {
    return true;
  }

  return false;
}

function getStorageTargetName(node) {
  if (node.type === "Identifier" && ["localStorage", "sessionStorage"].includes(node.name)) {
    return node.name;
  }

  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object.type === "Identifier" &&
    ["window", "globalThis"].includes(node.object.name) &&
    node.property.type === "Identifier" &&
    ["localStorage", "sessionStorage"].includes(node.property.name)
  ) {
    return node.property.name;
  }

  return null;
}

const presenterNoSideEffects = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow side effects and storage access inside presenter folders.",
    },
    schema: [],
    messages: {
      fetch:
        `Presenter components must not perform side effects. Move \`fetch\` to an orchestrator, hook, Server Component, or Server Action. Rule: ${COMPONENTS_RULE_PATH}`,
      storage:
        `Presenter components must not touch browser storage. Move \`{{storageName}}\` access to an orchestrator or hook instead. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isPresenterFile(normalizedFilename)) {
      return {};
    }

    return {
      CallExpression(node) {
        if (!isFetchCall(node)) {
          return;
        }

        context.report({
          node,
          messageId: "fetch",
        });
      },
      MemberExpression(node) {
        const storageName = getStorageTargetName(node);
        if (!storageName) {
          return;
        }

        context.report({
          node,
          messageId: "storage",
          data: {
            storageName,
          },
        });
      },
      Identifier(node) {
        if (node.parent?.type === "MemberExpression") {
          return;
        }

        if (!["localStorage", "sessionStorage"].includes(node.name)) {
          return;
        }

        context.report({
          node,
          messageId: "storage",
          data: {
            storageName: node.name,
          },
        });
      },
    };
  },
};

// Methods that, anywhere in a presenter file, signal view-model work
// that should live in the orchestrator or a useFooViewModel hook.
// The presenter receives ready-to-render strings/numbers/booleans.
const FORBIDDEN_PRESENTER_METHOD_CALLS = new Set([
  "toLocaleDateString",
  "toLocaleTimeString",
  "toLocaleString",
  "toFixed",
  "toPrecision",
  "toExponential",
  "format",            // Intl.DateTimeFormat#format, etc.
  "formatRange",
  "formatToParts",
]);

// Array methods that represent transformation logic. We allow .map() because
// it's the canonical iteration primitive in JSX, but flag the others — those
// reshape upstream data and should run in a hook/orchestrator.
const FORBIDDEN_PRESENTER_JSX_ARRAY_METHODS = new Set([
  "filter",
  "reduce",
  "reduceRight",
  "sort",
  "flatMap",
]);

// Globally-available constructors / coercion helpers banned in presenters.
// Receiving a `string` and rendering it is the contract — coercion is upstream.
const FORBIDDEN_PRESENTER_FREE_FUNCTIONS = new Set([
  "Number",
  "parseInt",
  "parseFloat",
]);

// Built-in classes that are formatting machinery. Constructing them inside a
// presenter file is a strong signal that view-model logic is colocated where
// it should not be.
const FORBIDDEN_PRESENTER_NEW_EXPRESSIONS = new Set([
  "Date",
  // Intl namespace ctors are flagged via MemberExpression below.
]);

const FORBIDDEN_PRESENTER_INTL_CTORS = new Set([
  "DateTimeFormat",
  "NumberFormat",
  "RelativeTimeFormat",
  "ListFormat",
  "PluralRules",
  "Collator",
  "Segmenter",
]);

function findEnclosingJsx(node) {
  let cursor = node.parent;
  while (cursor) {
    if (cursor.type === "JSXExpressionContainer") return cursor;
    if (
      cursor.type === "FunctionDeclaration" ||
      cursor.type === "FunctionExpression" ||
      cursor.type === "ArrowFunctionExpression"
    ) {
      return null;
    }
    cursor = cursor.parent;
  }
  return null;
}

const presenterNoFormatting = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Presenters must contain no view-model logic — neither in the JSX nor in helpers above the component. Move date/number formatting and array reshaping to the orchestrator, a useFooViewModel hook, or the route's `_lib/`.",
    },
    schema: [],
    messages: {
      methodCall:
        `Presenter file must not call \`{{name}}\`. Move date/number formatting upstream (orchestrator, useFooViewModel hook, or _lib/). Rule: ${COMPONENTS_RULE_PATH}`,
      newExpression:
        `Presenter file must not construct \`new {{name}}(...)\`. Build the formatted value upstream and pass it as a prop. Rule: ${COMPONENTS_RULE_PATH}`,
      intlCtor:
        `Presenter file must not construct \`new Intl.{{name}}(...)\`. Format upstream and pass the string as a prop. Rule: ${COMPONENTS_RULE_PATH}`,
      arrayTransformInJsx:
        `Presenter JSX must not transform arrays with \`.{{name}}\`. Pass an already-shaped array via props. Rule: ${COMPONENTS_RULE_PATH}`,
      freeCall:
        `Presenter file must not call \`{{name}}(...)\` for value coercion. Coerce upstream and pass a fully-typed prop. Rule: ${COMPONENTS_RULE_PATH}`,
      nestedTernary:
        `Presenter JSX must not derive labels via nested ternaries. Compute the resolved string upstream and pass it as a prop. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isPresenterFile(normalizedFilename)) {
      return {};
    }

    return {
      // ── Calls anywhere in the file ────────────────────────────────────────
      CallExpression(node) {
        // Member-call: x.method(...)
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier"
        ) {
          const methodName = node.callee.property.name;
          if (FORBIDDEN_PRESENTER_METHOD_CALLS.has(methodName)) {
            context.report({
              node,
              messageId: "methodCall",
              data: { name: methodName },
            });
            return;
          }
          // Array reshaping is only flagged inside JSX — outside the JSX it's
          // typically just .map() iteration which we tolerate.
          if (
            FORBIDDEN_PRESENTER_JSX_ARRAY_METHODS.has(methodName) &&
            findEnclosingJsx(node)
          ) {
            context.report({
              node,
              messageId: "arrayTransformInJsx",
              data: { name: methodName },
            });
          }
          return;
        }

        // Free-standing coercion: Number(x), parseInt(x), parseFloat(x).
        if (node.callee.type === "Identifier") {
          if (FORBIDDEN_PRESENTER_FREE_FUNCTIONS.has(node.callee.name)) {
            context.report({
              node,
              messageId: "freeCall",
              data: { name: node.callee.name },
            });
          }
        }
      },

      // ── new Date(...) anywhere in the file ────────────────────────────────
      NewExpression(node) {
        // new Date(...)
        if (
          node.callee.type === "Identifier" &&
          FORBIDDEN_PRESENTER_NEW_EXPRESSIONS.has(node.callee.name)
        ) {
          context.report({
            node,
            messageId: "newExpression",
            data: { name: node.callee.name },
          });
          return;
        }
        // new Intl.DateTimeFormat(...), new Intl.NumberFormat(...), ...
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "Intl" &&
          node.callee.property.type === "Identifier" &&
          FORBIDDEN_PRESENTER_INTL_CTORS.has(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: "intlCtor",
            data: { name: node.callee.property.name },
          });
        }
      },

      // ── Nested ternaries inside JSX: { a ? "x" : b ? "y" : "z" } ──────────
      ConditionalExpression(node) {
        if (!findEnclosingJsx(node)) return;
        if (node.parent?.type === "ConditionalExpression") {
          // The outer ternary will report; skip to avoid duplicates.
          return;
        }
        const hasNested =
          node.consequent.type === "ConditionalExpression" ||
          node.alternate.type === "ConditionalExpression";
        if (!hasNested) return;
        context.report({
          node,
          messageId: "nestedTernary",
        });
      },
    };
  },
};

const orchestratorNoDirectFetch = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct fetch calls inside orchestrator components.",
    },
    schema: [],
    messages: {
      fetch:
        `Orchestrator components should wire state and interactions, not perform direct \`fetch\` calls. Move data access to a hook, Server Component, Server Action, or dedicated client module. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isOrchestratorFile(normalizedFilename)) {
      return {};
    }

    return {
      CallExpression(node) {
        if (!isFetchCall(node)) {
          return;
        }

        context.report({
          node,
          messageId: "fetch",
        });
      },
    };
  },
};

const hookNoJsx = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow JSX inside hook files.",
    },
    schema: [],
    messages: {
      jsx:
        `Hooks must return data and handlers, never JSX. Move rendering into a presenter or orchestrator component. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isHookFile(normalizedFilename)) {
      return {};
    }

    let hasReported = false;

    function report(node) {
      if (hasReported) {
        return;
      }

      hasReported = true;
      context.report({
        node,
        messageId: "jsx",
      });
    }

    return {
      JSXElement: report,
      JSXFragment: report,
    };
  },
};

const noInternalLinkAnchor = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw `<a>` for any navigation. Always use `next/link`.",
    },
    schema: [],
    messages: {
      anchor:
        `Use \`next/link\` instead of a raw \`<a>\`. \`<Link>\` handles prefetch, client navigation, and accessibility. Rule: ${UI_COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (getJsxName(node) !== "a") return;

        const hrefAttr = getAttribute(node, "href");
        if (!hrefAttr) return;

        // Literal external URLs (https://, mailto:, tel:) are still allowed via `<a>`.
        const literal = getLiteralStringAttributeValue(hrefAttr);
        if (
          literal !== null &&
          /^(?:https?:|mailto:|tel:|sms:|#|data:)/i.test(literal)
        ) {
          return;
        }

        // Dynamic href ({url}, template literals, conditionals…) is treated as
        // potentially internal — use next/link unless the project has a clear
        // need for a raw anchor (target="_blank" download workflows: still
        // prefer Link with the same attributes; the rule keeps it simple).
        context.report({
          node,
          messageId: "anchor",
        });
      },
    };
  },
};

const noRawJsxPrimitives = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw JSX primitives when a project primitive exists.",
    },
    schema: [],
    messages: {
      forbidden: "{{message}}",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!jsxName) {
          return;
        }

        const message = RAW_JSX_PRIMITIVES.get(jsxName);
        if (!message) {
          return;
        }

        if (jsxName === "a") {
          return;
        }

        context.report({
          node,
          messageId: "forbidden",
          data: { message },
        });
      },
    };
  },
};

const noLucideReactImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow lucide-react in favor of Remix Icon.",
    },
    schema: [],
    messages: {
      lucide: `Use \`@remixicon/react\` instead of \`lucide-react\`. Rule: ${UI_COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "lucide-react") {
          return;
        }

        context.report({
          node,
          messageId: "lucide",
        });
      },
    };
  },
};

const noRawTailwindColors = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw Tailwind color utilities and arbitrary color values outside project tokens.",
    },
    schema: [],
    messages: {
      color:
        `Use project color tokens instead of raw Tailwind colors. Rule: ${THEME_RULE_PATH}`,
      arbitrary:
        `Arbitrary color values bypass the design token system. Add a token in styles/globals.css and reference it via the Tailwind class. Rule: ${THEME_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const tokens = getClassTokens(node);
        for (const token of tokens) {
          if (ARBITRARY_COLOR_VALUE_PATTERN.test(token)) {
            context.report({ node, messageId: "arbitrary" });
            return;
          }
          if (RAW_TAILWIND_COLOR_PATTERN.test(token)) {
            context.report({ node, messageId: "color" });
            return;
          }
        }
      },
    };
  },
};

const noHeadingWithoutDisplayFont = {
  meta: {
    type: "problem",
    docs: {
      description: "Require font-display on semantic headings.",
    },
    schema: [],
    messages: {
      heading:
        `Semantic headings must include \`font-display\`. Rule: ${THEME_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!["h1", "h2", "h3"].includes(jsxName ?? "")) {
          return;
        }

        const classNameAttribute = getAttribute(node, "className");
        if (!classNameAttribute) {
          context.report({
            node,
            messageId: "heading",
          });
          return;
        }

        const tokens = getClassTokens(node);
        if (tokens.length === 0) {
          return;
        }

        if (!hasFontToken(tokens, "font-display")) {
          context.report({
            node,
            messageId: "heading",
          });
        }
      },
    };
  },
};

const noCodeWithoutMonoFont = {
  meta: {
    type: "problem",
    docs: {
      description: "Require font-mono on code-like semantic elements.",
    },
    schema: [],
    messages: {
      code:
        `Semantic code blocks must include \`font-mono\`. Rule: ${THEME_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!["code", "pre"].includes(jsxName ?? "")) {
          return;
        }

        const classNameAttribute = getAttribute(node, "className");
        if (!classNameAttribute) {
          context.report({
            node,
            messageId: "code",
          });
          return;
        }

        const tokens = getClassTokens(node);
        if (tokens.length === 0) {
          return;
        }

        if (!hasFontToken(tokens, "font-mono")) {
          context.report({
            node,
            messageId: "code",
          });
        }
      },
    };
  },
};

const noFauxCardContainers = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn on likely hand-rolled card containers.",
    },
    schema: [],
    messages: {
      card:
        `This container looks like a hand-rolled card/panel. Prefer Card primitives. Rule: ${UI_COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!["article", "div", "section"].includes(jsxName ?? "")) {
          return;
        }

        const tokens = getClassTokens(node);
        if (
          hasSurfaceToken(tokens, CARD_SURFACE_TOKENS) &&
          hasBorderToken(tokens) &&
          hasPaddingToken(tokens)
        ) {
          context.report({
            node,
            messageId: "card",
          });
        }
      },
    };
  },
};

const noFauxBadgeContainers = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn on likely hand-rolled badge containers.",
    },
    schema: [],
    messages: {
      badge:
        `This container looks like a hand-rolled badge/tag. Prefer Badge primitives. Rule: ${UI_COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!["div", "span"].includes(jsxName ?? "")) {
          return;
        }

        const tokens = getClassTokens(node);
        const hasCompactPadding =
          tokens.some((token) => /^px-\d+/.test(token)) &&
          tokens.some((token) => /^py-\d+/.test(token));
        const hasBadgeText = tokens.some((token) => token === "text-xs" || token.startsWith("text-["));

        if (
          hasSurfaceToken(tokens, BADGE_SURFACE_TOKENS) &&
          hasCompactPadding &&
          hasRoundedToken(tokens) &&
          hasBadgeText
        ) {
          context.report({
            node,
            messageId: "badge",
          });
        }
      },
    };
  },
};

const noFauxAlertContainers = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn on likely hand-rolled alert containers.",
    },
    schema: [],
    messages: {
      alert:
        `This container looks like a hand-rolled alert/banner. Prefer Alert primitives. Rule: ${UI_COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const jsxName = getJsxName(node);
        if (!["article", "div", "section"].includes(jsxName ?? "")) {
          return;
        }

        const tokens = getClassTokens(node);
        const roleValue = getLiteralStringAttributeValue(getAttribute(node, "role"));
        const hasAlertSemantics = roleValue === "alert" || hasAttribute(node, "aria-live");

        if (
          hasBorderToken(tokens) &&
          hasPaddingToken(tokens) &&
          (hasAlertSemantics || hasSurfaceToken(tokens, ALERT_TOKENS))
        ) {
          context.report({
            node,
            messageId: "alert",
          });
        }
      },
    };
  },
};

// Color-style attributes that, on SVG and HTML elements, can carry literal colors
// that escape the className-based design-token system.
const COLOR_LITERAL_JSX_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "color",
  "stopColor",
  "floodColor",
  "lightingColor",
]);

// Named CSS colors that are forbidden as literals (subset — covers the common drift cases).
const NAMED_CSS_COLORS = new Set([
  "white", "black", "red", "blue", "green", "yellow", "orange", "purple",
  "pink", "gray", "grey", "cyan", "magenta", "lime", "indigo", "violet",
  "teal", "maroon", "navy", "olive", "silver", "gold", "beige", "tan",
]);

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNCTIONAL_COLOR_PATTERN = /^(?:rgba?|hsla?|oklch|oklab|color)\s*\(/;

function isLiteralColorValue(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (HEX_COLOR_PATTERN.test(trimmed)) return true;
  if (FUNCTIONAL_COLOR_PATTERN.test(trimmed)) return true;
  if (NAMED_CSS_COLORS.has(trimmed.toLowerCase())) return true;
  return false;
}

// Properties on a `style={{ ... }}` object that hold (or embed) colors.
// Including the shorthand background and gradient-bearing properties — e.g.
// `style={{ backgroundImage: "linear-gradient(..., #abc, ...)" }}` would
// otherwise sneak hex colors past the design-token system.
const STYLE_COLOR_PROPERTIES = new Set([
  "color",
  "background",
  "backgroundColor",
  "backgroundImage",
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderImage",
  "borderImageSource",
  "outline",
  "outlineColor",
  "fill",
  "stroke",
  "caretColor",
  "textDecoration",
  "textDecorationColor",
  "boxShadow",
  "textShadow",
  "filter",
  "WebkitTextFillColor",
  "WebkitTextStrokeColor",
  "columnRuleColor",
  "scrollbarColor",
]);

function styleStringContainsLiteralColor(value) {
  if (typeof value !== "string") return false;
  if (HEX_COLOR_PATTERN.test(value.trim())) return true;
  if (FUNCTIONAL_COLOR_PATTERN.test(value.trim())) return true;
  // Embedded inside a longer string (gradients, shorthand backgrounds…)
  if (/#[0-9a-fA-F]{3,8}\b/.test(value)) return true;
  if (/\b(?:rgba?|hsla?|oklch|oklab|color)\s*\(/.test(value)) return true;
  for (const named of NAMED_CSS_COLORS) {
    const re = new RegExp(`(?:^|[^\\w-])${named}(?:[^\\w-]|$)`, "i");
    if (re.test(value)) return true;
  }
  return false;
}

const noRawColorLiterals = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw color literals in JSX attributes (fill, stroke, color) and inline style objects.",
    },
    schema: [],
    messages: {
      attribute:
        `Color literal in JSX attribute \`{{attr}}\`. Use a Tailwind token via className (e.g. \`fill-current\` + \`text-foreground\`) or pass a CSS variable like \`var(--color-foreground)\`. Rule: ${THEME_RULE_PATH}`,
      style:
        `Color literal in inline \`style.{{prop}}\`. Use a Tailwind token via className, or reference a CSS variable like \`var(--color-card)\`. Rule: ${THEME_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.type !== "JSXIdentifier") return;
        const attrName = node.name.name;
        if (!COLOR_LITERAL_JSX_ATTRIBUTES.has(attrName)) return;
        if (!node.value) return;

        let literal = null;
        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          literal = node.value.value;
        } else if (
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression.type === "Literal" &&
          typeof node.value.expression.value === "string"
        ) {
          literal = node.value.expression.value;
        }
        if (literal === null) return;
        if (!isLiteralColorValue(literal)) return;
        // Allow theme-aware values: `currentColor`, `inherit`, `transparent`, `none`,
        // and `var(--…)`.
        const lowered = literal.trim().toLowerCase();
        if (
          lowered === "currentcolor" ||
          lowered === "inherit" ||
          lowered === "transparent" ||
          lowered === "none" ||
          lowered.startsWith("var(")
        ) {
          return;
        }

        context.report({
          node,
          messageId: "attribute",
          data: { attr: attrName },
        });
      },
      Property(node) {
        // Walk style={{ ... }} object literals.
        if (node.parent?.type !== "ObjectExpression") return;
        // Scope to JSXAttribute named "style".
        let cursor = node.parent.parent;
        // node.parent.parent is JSXExpressionContainer → its parent is JSXAttribute
        if (cursor?.type !== "JSXExpressionContainer") return;
        cursor = cursor.parent;
        if (cursor?.type !== "JSXAttribute") return;
        if (cursor.name?.name !== "style") return;

        let key = null;
        if (node.key.type === "Identifier") key = node.key.name;
        else if (node.key.type === "Literal" && typeof node.key.value === "string") key = node.key.value;
        if (!key || !STYLE_COLOR_PROPERTIES.has(key)) return;

        // Only check static string values; dynamic expressions are allowed.
        let value = null;
        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          value = node.value.value;
        } else if (
          node.value.type === "TemplateLiteral" &&
          node.value.expressions.length === 0
        ) {
          value = node.value.quasis.map((q) => q.value.cooked ?? "").join("");
        }
        if (value === null) return;
        if (!styleStringContainsLiteralColor(value)) return;
        const lowered = value.trim().toLowerCase();
        if (
          lowered === "currentcolor" ||
          lowered === "inherit" ||
          lowered === "transparent" ||
          lowered === "none" ||
          lowered.startsWith("var(")
        ) {
          return;
        }

        context.report({
          node,
          messageId: "style",
          data: { prop: key },
        });
      },
    };
  },
};

const noFilterInvert = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow CSS filter invert Tailwind class — use separate white/dark logo assets instead.",
    },
    schema: [],
    messages: {
      invert: `Use separate white/dark asset files instead of the \`invert\` CSS filter class. Rule: ${THEME_RULE_PATH}`,
    },
  },
  create(context) {
    function isInvertToken(token) {
      return /(?:^|:)invert$/.test(token);
    }

    function hasInvertInString(value) {
      if (typeof value !== "string") return false;
      return value.split(/\s+/).some(isInvertToken);
    }

    function checkExpression(expression, reportNode) {
      if (!expression) return;

      if (expression.type === "Literal") {
        if (hasInvertInString(expression.value)) {
          context.report({ node: reportNode, messageId: "invert" });
        }
        return;
      }

      if (expression.type === "LogicalExpression") {
        checkExpression(expression.right, reportNode);
        return;
      }

      if (expression.type === "ConditionalExpression") {
        checkExpression(expression.consequent, reportNode);
        checkExpression(expression.alternate, reportNode);
        return;
      }

      if (
        expression.type === "CallExpression" &&
        expression.callee.type === "Identifier" &&
        ["cn", "clsx", "cva"].includes(expression.callee.name)
      ) {
        for (const arg of expression.arguments) {
          checkExpression(arg, reportNode);
        }
      }
    }

    return {
      JSXOpeningElement(node) {
        const classNameAttr = getAttribute(node, "className");
        if (!classNameAttr || classNameAttr.type !== "JSXAttribute") return;

        const value = classNameAttr.value;
        if (!value) return;

        if (value.type === "Literal") {
          if (hasInvertInString(value.value)) {
            context.report({ node: classNameAttr, messageId: "invert" });
          }
          return;
        }

        if (value.type === "JSXExpressionContainer") {
          checkExpression(value.expression, classNameAttr);
        }
      },
    };
  },
};

// ─── React keys: forbid unstable / non-deterministic / index-only keys ──────

// Names used as the second `.map((item, i) => …)` callback parameter — i.e. the
// array index. Using one of these as a `key` produces React reconciliation bugs
// the moment the list reorders (state mismatch, focus jump, animation flash).
const FORBIDDEN_BARE_INDEX_NAMES = new Set([
  "i",
  "idx",
  "index",
  "n",
  "k",
  "_i",
  "_idx",
  "_index",
]);

// Calls that yield a fresh value on every render — using one as a key makes
// React see a brand-new component every time and remount the entire subtree.
function isNonDeterministicCall(node) {
  if (node.type !== "CallExpression") return false;
  const c = node.callee;
  // Math.random(), Date.now(), performance.now()
  if (
    c.type === "MemberExpression" &&
    !c.computed &&
    c.object.type === "Identifier" &&
    c.property.type === "Identifier"
  ) {
    if (c.object.name === "Math" && c.property.name === "random") return true;
    if (c.object.name === "Date" && c.property.name === "now") return true;
    if (c.object.name === "performance" && c.property.name === "now") return true;
    if (c.object.name === "crypto" && c.property.name === "randomUUID") return true;
  }
  // Bare random()/randomUUID() (e.g. shadowed import) — best-effort.
  if (c.type === "Identifier" && (c.name === "uuid" || c.name === "uuidv4" || c.name === "nanoid")) {
    return true;
  }
  return false;
}

// Returns true if the expression is essentially the array index (or a wrapper
// around it: `String(i)`, `` `row-${i}` ``, `i + 1`, `i.toString()`).
function isIndexOnlyExpression(node) {
  if (!node) return false;

  // Bare identifier that matches a typical index name.
  if (node.type === "Identifier" && FORBIDDEN_BARE_INDEX_NAMES.has(node.name)) {
    return true;
  }

  // Template literal whose ONLY interpolations are index identifiers.
  if (node.type === "TemplateLiteral") {
    if (node.expressions.length === 0) return false;
    return node.expressions.every((expr) => isIndexOnlyExpression(expr));
  }

  // String wrappers: String(i), `${i}`.
  if (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "String" &&
    node.arguments.length === 1
  ) {
    return isIndexOnlyExpression(node.arguments[0]);
  }

  // .toString() on an index.
  if (
    node.type === "CallExpression" &&
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "toString"
  ) {
    return isIndexOnlyExpression(node.callee.object);
  }

  // Arithmetic where every operand is index-only: i + 1, i * 2.
  if (node.type === "BinaryExpression") {
    return (
      isIndexOnlyExpression(node.left) &&
      (node.right.type === "Literal" || isIndexOnlyExpression(node.right))
    );
  }

  return false;
}

const noUnstableKeys = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow array-index-only or non-deterministic React keys. Use a stable identifier from the data (id, slug, etc.).",
    },
    schema: [],
    messages: {
      bareIndex:
        "Do not use the array index as a React `key`. When the list reorders, React mismatches state, focus, and animation. Use a stable identifier from the data (e.g. `key={item.id}`). If the list is truly static and never reorders, hardcode the JSX or wrap with `// eslint-disable-next-line bedrock/no-unstable-keys -- <reason>`.",
      indexInTemplate:
        "Template literal `key` only embeds the array index. Prefixing the index doesn't fix reconciliation — use the underlying item's stable identifier (`key={item.id}` or similar).",
      nonDeterministic:
        "`key` must be deterministic. `Math.random()`, `Date.now()`, `crypto.randomUUID()`, etc. produce a fresh value every render and force React to remount the entire subtree. Use a stable identifier from the data.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.type !== "JSXIdentifier" || node.name.name !== "key") return;
        if (!node.value) return;
        if (node.value.type !== "JSXExpressionContainer") return;
        const expr = node.value.expression;

        // 1) Non-deterministic call.
        if (isNonDeterministicCall(expr)) {
          context.report({ node, messageId: "nonDeterministic" });
          return;
        }

        // 2) Bare index identifier.
        if (expr.type === "Identifier" && FORBIDDEN_BARE_INDEX_NAMES.has(expr.name)) {
          context.report({ node, messageId: "bareIndex" });
          return;
        }

        // 3) Template literal that only embeds the index.
        if (expr.type === "TemplateLiteral" && expr.expressions.length > 0) {
          const allIndex = expr.expressions.every((e) => isIndexOnlyExpression(e));
          if (allIndex) {
            context.report({ node, messageId: "indexInTemplate" });
          }
          return;
        }

        // 4) Wrapper around the index: String(i), i.toString().
        if (isIndexOnlyExpression(expr) && expr.type !== "Identifier") {
          context.report({ node, messageId: "bareIndex" });
        }
      },
    };
  },
};

// ─── logger enforcement (withEvlog) ──────────────────────────────────────────────────────

const HTTP_VERB_NAMES = new Set([
  "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD",
]);

function isApiRouteHandlerFile(filename) {
  return /\/app\/api\/.+\/route\.[cm]?ts$/.test(filename);
}

const routeHandlerMustUseLogger = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require API route handlers to be wrapped with withEvlog() so logs and errors flow into the wide-event pipeline.",
    },
    schema: [],
    messages: {
      missingWrapper:
        `\`{{verb}}\` in an API route must be wrapped with \`withEvlog()\` (from \`@/lib/evlog\`). Rule: ${LOGGING_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isApiRouteHandlerFile(normalizedFilename)) {
      return {};
    }

    function isWithEvlogCall(expression) {
      if (!expression) return false;
      if (expression.type !== "CallExpression") return false;
      const callee = expression.callee;
      if (callee.type === "Identifier" && callee.name === "withEvlog") return true;
      if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.property.type === "Identifier" &&
        callee.property.name === "withEvlog"
      ) {
        return true;
      }
      return false;
    }

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return;
        if (node.declaration.type !== "VariableDeclaration") return;
        for (const decl of node.declaration.declarations) {
          if (decl.id.type !== "Identifier") continue;
          if (!HTTP_VERB_NAMES.has(decl.id.name)) continue;
          if (!decl.init) continue;
          if (isWithEvlogCall(decl.init)) continue;
          context.report({
            node: decl,
            messageId: "missingWrapper",
            data: { verb: decl.id.name },
          });
        }
      },
    };
  },
};

function isServerOnlyFile(filename, sourceCodeText) {
  if (isApiRouteHandlerFile(filename)) return true;
  if (/\/app\/.*\/_actions\/.+\.[cm]?ts$/.test(filename)) return true;
  if (/\/features\/[^/]+\/actions\.[cm]?ts$/.test(filename)) return true;
  // Anything containing "use server" directive at top of file.
  if (sourceCodeText && /(^|\n)\s*['"]use server['"]\s*;?/m.test(sourceCodeText.slice(0, 500))) {
    return true;
  }
  return false;
}

const noThrowNewErrorInServer = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `throw new Error()` in server code. Use `createError({ status, message, why, fix })` from @/lib/evlog so context is captured.",
    },
    schema: [],
    messages: {
      forbidden:
        `Use \`createError({ status, message, why, fix })\` from \`@/lib/evlog\` instead of \`throw new Error(...)\` in server code (route handlers, server actions, "use server" modules). Rule: ${LOGGING_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    const sourceText = context.sourceCode?.getText() ?? context.getSourceCode().getText();
    if (!isServerOnlyFile(normalizedFilename, sourceText)) {
      return {};
    }

    return {
      ThrowStatement(node) {
        if (!node.argument) return;
        if (node.argument.type !== "NewExpression") return;
        if (node.argument.callee.type !== "Identifier") return;
        // We forbid the bare Error / TypeError / RangeError plus aliases.
        const calleeName = node.argument.callee.name;
        if (!["Error", "TypeError", "RangeError", "SyntaxError"].includes(calleeName)) return;
        context.report({
          node,
          messageId: "forbidden",
        });
      },
    };
  },
};

// ─── Imports: forbid CROSS-ROUTE imports of another route's _components/_actions ──

// Returns the route prefix (everything BEFORE `/_components/` or `/_actions/`) for
// a path that lives inside a route-private folder. Example:
//   app/(dashboard)/app/profile/_components/foo/bar.tsx
// → app/(dashboard)/app/profile
function extractRoutePrivatePrefix(path) {
  const match = path.match(/^(.*)\/_(?:components|actions)\//);
  return match ? match[1] : null;
}

const noCrossRoutePrivateImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing from another route's `_components/` or `_actions/`. Same-route imports are allowed; cross-route ones must be promoted to features/ or components/shared/.",
    },
    schema: [],
    messages: {
      forbidden:
        `Never import from another route's \`{{kind}}\`. Promote the shared element to \`features/\` or \`components/shared/\` instead. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const filenameNormalized = normalizeFilename(context.filename);
    const cwd = (context.cwd ?? process.cwd()).split(path.sep).join("/");
    // The importer's path relative to the repo root (e.g. "app/(dashboard)/...").
    const importerProjectPath = filenameNormalized.startsWith(cwd + "/")
      ? filenameNormalized.slice(cwd.length + 1)
      : filenameNormalized;

    function check(node, source) {
      if (typeof source !== "string") return;
      // Only consider absolute aliases pointing at a route-private folder.
      if (!source.startsWith("@/app/")) return;
      const importedPath = source.slice(2); // strip "@/"
      const importedPrefix = extractRoutePrivatePrefix(importedPath);
      if (!importedPrefix) return;
      // Same route ⇔ the importer lives under the imported prefix.
      if (importerProjectPath.startsWith(importedPrefix + "/")) return;
      const kind = source.includes("/_components/") ? "_components/" : "_actions/";
      context.report({
        node,
        messageId: "forbidden",
        data: { kind },
      });
    }

    return {
      ImportDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
    };
  },
};

// ─── Imports: forbid `../` relative parents (project mandates @/ alias) ──────

function resolveRelativeImportToAlias(filename, source, cwd) {
  if (typeof source !== "string" || !source.startsWith("../")) return null;
  const filenameNormalized = filename.split(path.sep).join("/");
  const cwdNormalized = cwd.split(path.sep).join("/");
  const fileDir = filenameNormalized.slice(0, filenameNormalized.lastIndexOf("/"));
  const resolved = path.posix.normalize(path.posix.join(fileDir, source));
  if (!resolved.startsWith(cwdNormalized + "/")) return null;
  const relFromRoot = resolved.slice(cwdNormalized.length + 1);
  return `@/${relFromRoot}`;
}

const noParentRelativeImports = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Disallow `../` relative parent imports. Use the `@/` alias so file moves do not break neighbours.",
    },
    schema: [],
    messages: {
      forbidden:
        `Use the \`@/\` alias instead of \`{{source}}\`. Relative parent imports are forbidden — they couple the file to its current location and rot when files move. Rule: ${STRUCTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const cwd = context.cwd ?? process.cwd();

    function check(sourceNode, sourceValue) {
      if (typeof sourceValue !== "string" || !sourceValue.startsWith("../")) return;
      const replacement = resolveRelativeImportToAlias(
        normalizeFilename(context.filename),
        sourceValue,
        cwd,
      );
      context.report({
        node: sourceNode,
        messageId: "forbidden",
        data: { source: sourceValue },
        fix: replacement
          ? (fixer) => {
              const raw = sourceNode.raw ?? `"${sourceValue}"`;
              const quote = raw.startsWith("'") ? "'" : '"';
              return fixer.replaceText(sourceNode, `${quote}${replacement}${quote}`);
            }
          : null,
      });
    }

    return {
      ImportDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
      ImportExpression(node) {
        if (node.source?.type === "Literal") {
          check(node.source, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
    };
  },
};

// ─── Architecture: lib/ stays self-contained, even for type-only imports ─────

const noLibImportsFromFeatures = {
  meta: {
    type: "problem",
    docs: {
      description:
        "lib/ must not depend on features/ — even for type-only imports — so the technical layer stays a leaf.",
    },
    schema: [],
    messages: {
      forbidden:
        `Files under \`lib/\` must not import from \`@/features/\` (type-only imports included). Move the shared contract to \`types/\` or \`lib/<area>/contracts.ts\`. Rule: ${ARCHITECTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    // Only fire for the TOP-LEVEL `lib/` directory (i.e. the technical layer),
    // not for feature-internal `features/<x>/lib/` helpers — those are
    // legitimately allowed to know about the rest of the feature.
    const libIndex = normalizedFilename.lastIndexOf("/lib/");
    if (libIndex === -1) return {};
    const beforeLib = normalizedFilename.slice(0, libIndex);
    // If the segment before /lib/ contains /features/, it's a feature-internal lib.
    if (beforeLib.includes("/features/")) return {};
    // Skip lib/test/ which can mock anything during tests.
    if (/\/lib\/test\//.test(normalizedFilename)) return {};
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalizedFilename)) return {};

    function check(node, source) {
      if (typeof source !== "string") return;
      if (!source.startsWith("@/features/")) return;
      context.report({ node, messageId: "forbidden" });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
    };
  },
};

const noSharedImportsFromFeatures = {
  meta: {
    type: "problem",
    docs: {
      description:
        "components/shared/ must not depend on features/ so reusable UI stays below feature boundaries.",
    },
    schema: [],
    messages: {
      forbidden:
        `Files under \`components/shared/\` must not import from \`@/features/\` (type-only imports included). Pass feature UI through slots, or move shared contracts to \`types/\`. Rule: ${ARCHITECTURE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!/\/components\/shared\//.test(normalizedFilename)) {
      return {};
    }

    function check(node, source) {
      if (typeof source !== "string") return;
      if (!source.startsWith("@/features/")) return;
      context.report({ node, messageId: "forbidden" });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source?.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
    };
  },
};

// ─── Forms: useForm() must use zodResolver and onSubmit must not raw-fetch ──

const formsMustUseZod = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`useForm()` from react-hook-form must be configured with `resolver: zodResolver(...)` so the form's input schema is validated, and inferred types match the runtime guarantees.",
    },
    schema: [],
    messages: {
      missingZod:
        `\`useForm()\` must include \`resolver: zodResolver(...)\`. Define the schema with Zod and use \`z.infer<typeof schema>\` for the form values type. Rule: ${STATE_RULE_PATH}`,
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useForm") return;
        // Without arguments, RHF defaults are used — no zod schema attached.
        if (node.arguments.length === 0) {
          context.report({ node, messageId: "missingZod" });
          return;
        }
        const arg = node.arguments[0];
        if (!arg || arg.type !== "ObjectExpression") {
          context.report({ node, messageId: "missingZod" });
          return;
        }
        const resolverProp = arg.properties.find(
          (p) =>
            p.type === "Property" &&
            !p.computed &&
            p.key.type === "Identifier" &&
            p.key.name === "resolver",
        );
        if (!resolverProp || resolverProp.type !== "Property") {
          context.report({ node, messageId: "missingZod" });
          return;
        }
        const resolverValue = resolverProp.value;
        // Accept zodResolver(schema), inferred zodResolver(...), or imported aliases.
        const isZodResolverCall =
          resolverValue.type === "CallExpression" &&
          ((resolverValue.callee.type === "Identifier" &&
            resolverValue.callee.name === "zodResolver") ||
            (resolverValue.callee.type === "MemberExpression" &&
              resolverValue.callee.property.type === "Identifier" &&
              resolverValue.callee.property.name === "zodResolver"));
        if (!isZodResolverCall) {
          context.report({ node, messageId: "missingZod" });
        }
      },
    };
  },
};

// ─── Component-level discipline: 1 component per file, no large-file dumping ─

function jsxAppearsInBodyOf(node) {
  // Walks a function body looking for JSX. Returns true if found.
  let found = false;
  function walk(n) {
    if (found || !n || typeof n !== "object") return;
    if (n.type === "JSXElement" || n.type === "JSXFragment") {
      found = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const value = n[key];
      if (Array.isArray(value)) {
        for (const child of value) walk(child);
      } else if (value && typeof value === "object" && typeof value.type === "string") {
        walk(value);
      }
    }
  }
  walk(node);
  return found;
}

const oneComponentPerFile = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Each presenter or orchestrator file must export exactly one React component (private tiny sub-components are tolerated when they do not match an exported PascalCase function returning JSX).",
    },
    schema: [],
    messages: {
      tooMany:
        `This file declares {{count}} React components ({{names}}). Each component should live in its own file. Split it. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isPresenterFile(normalizedFilename) && !isOrchestratorFile(normalizedFilename)) {
      return {};
    }
    const components = [];

    function consider(name, node) {
      if (!name) return;
      if (!/^[A-Z]/.test(name)) return;
      if (jsxAppearsInBodyOf(node)) {
        components.push(name);
      }
    }

    return {
      "Program > ExportNamedDeclaration > FunctionDeclaration"(node) {
        consider(node.id?.name, node);
      },
      "Program > FunctionDeclaration"(node) {
        consider(node.id?.name, node);
      },
      "Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator"(node) {
        if (
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          consider(node.id.name, node.init);
        }
      },
      "Program > VariableDeclaration > VariableDeclarator"(node) {
        if (
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          consider(node.id.name, node.init);
        }
      },
      "Program:exit"(node) {
        if (components.length > 1) {
          context.report({
            node,
            messageId: "tooMany",
            data: {
              count: String(components.length),
              names: components.join(", "),
            },
          });
        }
      },
    };
  },
};

// ─── Orchestrator: must orchestrate (carry at least one smart signal) ───────

const ORCHESTRATOR_HOOK_NAME_PATTERN = /^use[A-Z]/;
const ORCHESTRATOR_TEST_FILE_PATTERN = /\.(test|spec|stories)\.tsx?$/;

// Import sources that on their own justify the orchestrator role. These cover
// the "smart" sub-tree (orchestrators wiring other orchestrators, providers,
// gates, hooks, server actions, stores) plus libraries whose API surface is
// inherently hook-based (TanStack Query, next/navigation, next/dynamic, sonner).
const ORCHESTRATOR_SMART_IMPORT_PATTERNS = [
  /\/(orchestrators|providers|gates|hooks)\//,
  /\/_(hooks|actions)\//,
  /\/lib\/stores\//,
  /^@tanstack\/react-query(?:\/|$)/,
  /^next\/dynamic$/,
  /^next\/navigation$/,
  /^sonner$/,
];

function isOrchestratorSiblingImport(source) {
  // A `./Sibling` import (no further slashes) from inside an orchestrators/
  // file resolves to another orchestrator in the same folder — that wires
  // orchestration intent the same way a smart sub-tree import would.
  return typeof source === "string" &&
    source.startsWith("./") &&
    !source.slice(2).includes("/");
}

function isOrchestratorSmartImport(source) {
  if (typeof source !== "string") return false;
  if (isOrchestratorSiblingImport(source)) return true;
  return ORCHESTRATOR_SMART_IMPORT_PATTERNS.some((pattern) => pattern.test(source));
}

const orchestratorMustOrchestrate = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Orchestrator files must carry at least one smart signal (hook call, async data fetch, dynamic import, JSX provider, or import from a smart sub-tree). Pure JSX wrappers belong in presenters/.",
    },
    schema: [],
    messages: {
      pureJsx:
        `\`{{filename}}\` lives in an orchestrators/ folder but has no smart signal (no hook call, no async/await, no dynamic import, no JSX provider, no import from orchestrators/providers/gates/hooks/stores). A pure JSX wrapper is a presenter — move it to \`presenters/\` or wire orchestration logic. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    if (!isOrchestratorFile(normalizedFilename)) {
      return {};
    }
    if (ORCHESTRATOR_TEST_FILE_PATTERN.test(normalizedFilename)) {
      return {};
    }

    let hasSmartSignal = false;

    function markSmart() {
      hasSmartSignal = true;
    }

    function inspectCallee(callee) {
      if (!callee) return;
      if (callee.type === "Identifier") {
        if (
          ORCHESTRATOR_HOOK_NAME_PATTERN.test(callee.name) ||
          callee.name === "dynamic"
        ) {
          markSmart();
        }
        return;
      }
      if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.property.type === "Identifier" &&
        ORCHESTRATOR_HOOK_NAME_PATTERN.test(callee.property.name)
      ) {
        markSmart();
      }
    }

    function inspectJsxName(node) {
      if (!node) return;
      if (node.type === "JSXIdentifier" && /Provider$/.test(node.name)) {
        markSmart();
        return;
      }
      if (
        node.type === "JSXMemberExpression" &&
        node.property.type === "JSXIdentifier" &&
        /Provider$/.test(node.property.name)
      ) {
        markSmart();
      }
    }

    return {
      ImportDeclaration(node) {
        if (hasSmartSignal) return;
        if (isOrchestratorSmartImport(node.source.value)) {
          markSmart();
        }
      },
      CallExpression(node) {
        if (hasSmartSignal) return;
        inspectCallee(node.callee);
      },
      AwaitExpression() {
        markSmart();
      },
      "FunctionDeclaration[async=true]"() {
        markSmart();
      },
      "FunctionExpression[async=true]"() {
        markSmart();
      },
      "ArrowFunctionExpression[async=true]"() {
        markSmart();
      },
      JSXOpeningElement(node) {
        if (hasSmartSignal) return;
        inspectJsxName(node.name);
      },
      "Program:exit"(node) {
        if (hasSmartSignal) return;
        context.report({
          node,
          messageId: "pureJsx",
          data: { filename: path.posix.basename(normalizedFilename) },
        });
      },
    };
  },
};

// ─── Zustand: require selector ───────────────────────────────────────────────

const zustandRequireSelector = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Zustand stores must be read with a selector (`useFooStore((s) => s.x)`); calling `useFooStore()` without arguments subscribes to the whole store and re-renders on every mutation.",
    },
    schema: [],
    messages: {
      missingSelector:
        `\`{{name}}\` must be called with a selector (\`{{name}}((s) => s.x)\`) to avoid full-store subscriptions. Rule: ${STATE_RULE_PATH}`,
    },
  },
  create(context) {
    const normalizedFilename = normalizeFilename(context.filename);
    // The store creation files in lib/stores/** legitimately read whole state.
    if (/\/lib\/stores\//.test(normalizedFilename)) return {};

    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        const name = node.callee.name;
        // Heuristic: useFooStore (PascalCase ending in "Store").
        if (!/^use[A-Z][A-Za-z0-9]*Store$/.test(name)) return;
        if (node.arguments.length > 0) return;
        context.report({
          node,
          messageId: "missingSelector",
          data: { name },
        });
      },
    };
  },
};

// ─── max-component-props ────────────────────────────────────────────────────
// A component that declares many separate props is usually doing too much or
// prop-drilling. Cap the count: group cohesive props into one typed object, or
// compose with children/slots. Counts the properties destructured from a
// component's first param (PascalCase function components).
const MAX_COMPONENT_PROPS_DEFAULT = 6;

function countObjectPatternProps(param) {
  if (!param || param.type !== "ObjectPattern") {
    return null;
  }
  return param.properties.filter((property) => property.type === "Property").length;
}

const maxComponentProps = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit the number of props a component declares. Group cohesive props into a typed object or compose with slots.",
    },
    schema: [
      {
        type: "object",
        properties: { max: { type: "number" } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany: `Component \`{{name}}\` declares {{count}} props (max {{max}}). Group cohesive props into one typed object, or split the component and pass children/slots. Rule: ${COMPONENTS_RULE_PATH}`,
    },
  },
  create(context) {
    const max = context.options[0]?.max ?? MAX_COMPONENT_PROPS_DEFAULT;

    function check(node, name) {
      if (typeof name !== "string" || !/^[A-Z]/.test(name)) {
        return;
      }
      const count = countObjectPatternProps(node.params[0]);
      if (count !== null && count > max) {
        context.report({
          node: node.params[0],
          messageId: "tooMany",
          data: { name, count, max },
        });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) {
          check(node, node.id.name);
        }
      },
      "VariableDeclarator > ArrowFunctionExpression"(node) {
        if (node.parent.type === "VariableDeclarator" && node.parent.id.type === "Identifier") {
          check(node, node.parent.id.name);
        }
      },
      "VariableDeclarator > FunctionExpression"(node) {
        if (node.parent.type === "VariableDeclarator" && node.parent.id.type === "Identifier") {
          check(node, node.parent.id.name);
        }
      },
    };
  },
};

const bedrockPlugin = {
  rules: {
    "hook-no-jsx": hookNoJsx,
    "max-component-props": maxComponentProps,
    "no-code-without-mono-font": noCodeWithoutMonoFont,
    "no-faux-alert-containers": noFauxAlertContainers,
    "no-faux-badge-containers": noFauxBadgeContainers,
    "no-faux-card-containers": noFauxCardContainers,
    "forms-must-use-zod": formsMustUseZod,
    "no-cross-feature-ui-imports": noCrossFeatureUiImports,
    "no-feature-domain-imports-from-app-or-components": noFeatureDomainImportsFromAppOrComponents,
    "no-feature-root-support-files": noFeatureRootSupportFiles,
    "no-filter-invert": noFilterInvert,
    "no-heading-without-display-font": noHeadingWithoutDisplayFont,
    "no-cross-route-private-imports": noCrossRoutePrivateImports,
    "no-internal-link-anchor": noInternalLinkAnchor,
    "no-lib-imports-from-features": noLibImportsFromFeatures,
    "no-lucide-react-imports": noLucideReactImports,
    "no-parent-relative-imports": noParentRelativeImports,
    "no-raw-color-literals": noRawColorLiterals,
    "no-raw-jsx-primitives": noRawJsxPrimitives,
    "no-raw-tailwind-colors": noRawTailwindColors,
    "no-shared-imports-from-features": noSharedImportsFromFeatures,
    "no-support-files-in-component-role-folders": noSupportFilesInComponentRoleFolders,
    "no-throw-new-error-in-server": noThrowNewErrorInServer,
    "no-unclassified-route-support-file": noUnclassifiedRouteSupportFile,
    "no-unstable-keys": noUnstableKeys,
    "no-unclassified-component-role": noUnclassifiedComponentRole,
    "one-component-per-file": oneComponentPerFile,
    "orchestrator-must-orchestrate": orchestratorMustOrchestrate,
    "orchestrator-no-direct-fetch": orchestratorNoDirectFetch,
    "presenter-no-formatting": presenterNoFormatting,
    "presenter-no-side-effects": presenterNoSideEffects,
    "presenter-no-smart-imports": presenterNoSmartImports,
    "presenter-no-smart-react-hooks": presenterNoSmartReactHooks,
    "route-handler-must-use-logger": routeHandlerMustUseLogger,
    "zustand-require-selector": zustandRequireSelector,
  },
};

export default bedrockPlugin;
