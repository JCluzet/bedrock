/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Circular dependencies make feature boundaries fragile and harder to reason about.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-feature-to-app",
      comment: "Features must not depend on app/ route files.",
      severity: "error",
      from: { path: "^features/" },
      to: { path: "^app/" },
    },
    {
      name: "no-feature-domain-to-components",
      comment:
        "Only a feature's component files (features/<name>/components/**) may depend on the presentation layer. Domain modules (lib, actions, root files) must not.",
      severity: "error",
      from: {
        path: "^features/",
        // A feature's component files live under a `components/` directory (at the
        // feature root or one sub-feature level deep). Everything else in a feature
        // is domain code and must not import the presentation layer.
        pathNot: "/components/",
      },
      to: { path: "^components/" },
    },
    {
      name: "no-lib-to-non-lib",
      comment: "lib/ should remain a technical layer that depends only on lib/.",
      severity: "error",
      from: {
        path: "^lib/",
        pathNot: "^lib/test/|^lib/.+\\.(test|spec)\\.[cm]?[jt]sx?$",
      },
      to: { pathNot: "^lib/" },
    },
    {
      name: "no-orphans",
      comment: "Orphaned production modules are usually dead code or missing entry wiring.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot:
          "^(components/ui/|features/.+/content/|docs/|public/|tools/|\\.agents/|styles/|types/|lib/test/|.*\\/types\\.ts$|.*\\.(test|spec)\\.[cm]?[jt]sx?$|app/.+/(error|loading|not-found|template|default)\\.tsx$|app/global-error\\.tsx$|app/manifest\\.webmanifest$|app/manifest\\.ts$)",
      },
      to: {},
    },
  ],
  options: {
    tsConfig: {
      fileName: "tsconfig.json",
    },
    doNotFollow: {
      path: "node_modules",
    },
    exclude:
      "^(node_modules|\\.next|out|build|coverage|docs/|public/|tools/semgrep/|\\.agents/)",
    includeOnly: "^(app|components|features|lib|types|middleware\\.ts|server\\.ts)",
    reporterOptions: {
      dot: {
        collapsePattern: "^(app|components|features|lib|types)/[^/]+",
      },
    },
  },
};
