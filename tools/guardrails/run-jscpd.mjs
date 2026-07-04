import { spawn } from "node:child_process";

const child = spawn("pnpm", ["exec", "jscpd", "--config", ".jscpd.json", "."], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  if ((code ?? 1) !== 0) {
    console.error("");
    console.error("Duplicate-code guardrail failed.");
    console.error("Rules: AGENTS.md, .agents/rules/architecture.md");
  }

  process.exit(code ?? 1);
});
