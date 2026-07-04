import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const uiDir = path.join(rootDir, "components/ui");
const rulesPath = path.join(rootDir, ".agents/rules/ui-components.md");

const documentedImports = new Set(
  Array.from(
    fs.readFileSync(rulesPath, "utf8").matchAll(/@\/components\/ui\/([a-z0-9-]+)/g),
    (match) => match[1],
  ),
);

const actualFiles = new Set(
  fs.readdirSync(uiDir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, "")),
);

const undocumented = [...actualFiles].filter((file) => !documentedImports.has(file)).sort();
const staleDocs = [...documentedImports].filter((file) => !actualFiles.has(file)).sort();

if (undocumented.length === 0 && staleDocs.length === 0) {
  console.log("UI component inventory is in sync.");
  process.exit(0);
}

if (undocumented.length > 0) {
  console.error("Undocumented UI primitives. Rule: .agents/rules/ui-components.md");
  for (const file of undocumented) {
    console.error(`- components/ui/${file}.tsx`);
  }
}

if (staleDocs.length > 0) {
  console.error("Stale UI component doc entries. Rule: .agents/rules/ui-components.md");
  for (const file of staleDocs) {
    console.error(`- @/components/ui/${file}`);
  }
}

process.exit(1);
