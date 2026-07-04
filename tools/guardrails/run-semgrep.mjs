import { spawn, spawnSync } from "node:child_process";

function commandExists(command) {
  const result = spawnSync("which", [command], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  return result.status === 0;
}

function run(command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    if ((code ?? 1) !== 0) {
      console.error("");
      console.error("Semgrep guardrail failed.");
      console.error("Rules: AGENTS.md, .agents/rules/architecture.md, .agents/rules/state.md");
    }

    process.exit(code ?? 1);
  });
}

const semgrepArgs = [
  "scan",
  "--config",
  "tools/semgrep",
  "--error",
  "--quiet",
  "--metrics=off",
  "app",
  "components",
  "features",
  "lib",
];

if (commandExists("semgrep")) {
  run("semgrep", semgrepArgs);
} else if (commandExists("docker")) {
  run("docker", [
    "run",
    "--rm",
    "-v",
    `${process.cwd()}:/src`,
    "-w",
    "/src",
    "semgrep/semgrep",
    "semgrep",
    ...semgrepArgs,
  ]);
} else {
  console.error("Semgrep is not available.");
  console.error("Install the local semgrep CLI or provide Docker to run tools/guardrails/run-semgrep.mjs.");
  process.exit(1);
}
