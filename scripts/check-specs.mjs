import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "docs/PRODUCT_SPEC.md", "docs/ARCHITECTURE.md", "docs/DATA_MODEL.md",
  "docs/SECURITY_MODEL.md", "docs/PERMISSIONS.md", "docs/STATE_MACHINES.md",
  "docs/OFFLINE_SYNC.md", "docs/IMPLEMENTATION_PLAN.md", "docs/QA_CHECKLIST.md",
  "docs/DEPLOYMENT.md", "docs/DECISIONS.md", "docs/PROGRESS.md",
  "docs/TRACEABILITY.md", "docs/CHANGE_CONTROL.md", "docs/AI_WORKFLOW.md", "specs/base/FE_BASE.md",
  "specs/base/BE_BASE.md", "specs/base/DEP_BASE.md",
  "specs/templates/FEATURE_SPEC_TEMPLATE.md", "AGENTS.md", "CONTRIBUTING.md",
];

const errors = [];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) errors.push(`Missing or empty: ${file}`);
}

const featuresDir = path.join(root, "specs/features");
const knownIds = new Set(["FE_BASE", "BE_BASE", "DEP_BASE"]);
const featureSpecs = [];
if (fs.existsSync(featuresDir)) {
  for (const name of fs.readdirSync(featuresDir).filter((item) => item.endsWith(".md") && item !== "README.md")) {
    const content = fs.readFileSync(path.join(featuresDir, name), "utf8");
    const value = (field) => content.match(new RegExp(`^${field}:\\s*(.+)$`, "m"))?.[1]?.trim();
    for (const field of ["id:", "title:", "status:", "owner:", "risk:", "source:", "related:"]) {
      if (!content.startsWith("---\n") || !content.includes(`\n${field}`)) errors.push(`${name}: missing front-matter field ${field}`);
    }
    const id = value("id");
    if (!id || !/^(FE|BE|DEP)-\d{3}$/.test(id)) errors.push(`${name}: id must match FE-000, BE-000, or DEP-000`);
    if (id && knownIds.has(id)) errors.push(`${name}: duplicate id ${id}`);
    if (id) {
      knownIds.add(id);
      featureSpecs.push({ name, content, id, value });
      if (!name.startsWith(`${id}-`)) errors.push(`${name}: filename must start with ${id}-`);
    }
    if (!new Set(["proposed", "clarified", "ready", "accepted", "implementing", "verifying", "human-acceptance", "done", "blocked", "deferred"]).has(value("status"))) errors.push(`${name}: invalid status`);
    if (!new Set(["tier-1", "tier-2", "tier-3"]).has(value("risk"))) errors.push(`${name}: invalid risk tier`);
    for (const section of ["# Problem and outcome", "## Scope", "## Behavior", "## Contracts", "## Quality and operations", "## Verification matrix", "## Approval"]) {
      if (!content.includes(section)) errors.push(`${name}: missing section ${section}`);
    }
    if (!/\bGIVEN\b[\s\S]*\bWHEN\b[\s\S]*\bTHEN\b/.test(content)) errors.push(`${name}: no GIVEN/WHEN/THEN acceptance scenario`);
  }
}

for (const spec of featureSpecs) {
  const related = spec.value("related")?.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim()).filter(Boolean) || [];
  for (const id of related) if (!knownIds.has(id)) errors.push(`${spec.name}: related id ${id} does not exist`);
}

if (errors.length) {
  console.error(`Spec guard failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Spec guard passed (${required.length} required artifacts checked).`);
