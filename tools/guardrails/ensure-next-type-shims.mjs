import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const shimTargets = [
  path.join(rootDir, ".next", "types", "routes.js"),
  path.join(rootDir, ".next", "dev", "types", "routes.js"),
];

for (const shimPath of shimTargets) {
  const dtsPath = shimPath.replace(/\.js$/, ".d.ts");

  if (!fs.existsSync(dtsPath) || fs.existsSync(shimPath)) {
    continue;
  }

  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, "export {};\n");
}
