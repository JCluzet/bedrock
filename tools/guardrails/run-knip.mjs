import { spawn } from "node:child_process";

const child = spawn(
  "pnpm",
  [
    "exec",
    "knip",
    "--config",
    "knip.ts",
    "--production",
    "--strict",
    "--no-progress",
    "--reporter",
    "compact",
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
    console.error("Dead-code guardrail failed.");
    console.error("Rules: AGENTS.md, .agents/rules/architecture.md, .agents/rules/structure.md");
  }

  process.exit(code ?? 1);
});
