import fs from "node:fs";
import { spawn } from "node:child_process";

const cruiseTargets = [
  "app",
  "components",
  "features",
  "lib",
  "types",
  "server.ts",
  "middleware.ts",
].filter((target) => fs.existsSync(target));

const child = spawn(
  "pnpm",
  [
    "exec",
    "depcruise",
    "--config",
    ".dependency-cruiser.cjs",
    "--output-type",
    "err",
    "--progress",
    "none",
    ...cruiseTargets,
  ],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code) => {
  if ((code ?? 1) !== 0) {
    console.error("");
    console.error("Dependency graph guardrail failed.");
    console.error("Rules: AGENTS.md, .agents/rules/architecture.md, .agents/rules/structure.md");
  }

  process.exit(code ?? 1);
});
