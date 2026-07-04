import { spawn } from "node:child_process";

const checks = [
  ["type-check", ["pnpm", "type-check"]],
  ["lint", ["pnpm", "lint"]],
  ["guardrails:inventory", ["pnpm", "guardrails:inventory"]],
  ["guardrails:ast", ["pnpm", "guardrails:ast"]],
  ["guardrails:dup", ["pnpm", "guardrails:dup"]],
  ["guardrails:deps", ["pnpm", "guardrails:deps"]],
  ["guardrails:knip", ["pnpm", "guardrails:knip"]],
  ["guardrails:semgrep", ["pnpm", "guardrails:semgrep"]],
  ["test:coverage", ["pnpm", "test:coverage"]],
];

const results = await Promise.all(
  checks.map(async ([label, command]) => {
    const [bin, ...args] = command;
    const { exitCode, output } = await new Promise((resolve) => {
      const child = spawn(bin, args, {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("exit", (code) => {
        resolve({
          exitCode: code ?? 1,
          output: `${stdout}${stderr}`.trim(),
        });
      });
    });

    return { label, exitCode, output };
  }),
);

let hasFailure = false;
const failedChecks = [];

for (const { label, exitCode, output } of results) {
  if (exitCode !== 0) {
    hasFailure = true;
    failedChecks.push(label);
    console.log("");
    console.log(`=== ${label} failed ===`);
    if (output) {
      console.log(output);
    }
    continue;
  }

  console.log(`${label} OK`);
}

if (failedChecks.length > 0) {
  console.log("");
  console.log("=== summary ===");
  for (const label of failedChecks) {
    console.log(`- ${label} failed`);
  }
}

process.exit(hasFailure ? 1 : 0);
