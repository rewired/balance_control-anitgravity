#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RULE_ID_PATTERN = "\\b(?:CORE|EXP|VAR|ADD56)-\\d{2}(?:-(?:\\d{2}[A-Z]?|[A-Z]|T\\d{2}))+(?:\\.\\d+[A-Z]?)*\\b";
const CORE_SOURCE = "docs/rules/000-core.md";

function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function getAllFiles(dirPath, extensions, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && !file.startsWith('.')) {
        getAllFiles(fullPath, extensions, arrayOfFiles);
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function collectEvidence(files, pattern, repoRoot) {
  const evidence = new Map();
  const regex = new RegExp(pattern, "g");

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = normalizePath(path.relative(repoRoot, file));
    const matches = content.matchAll(regex);
    for (const match of matches) {
      const id = match[1];
      if (!evidence.has(id)) {
        evidence.set(id, new Set());
      }
      evidence.get(id).add(relativePath);
    }
  }

  // Convert Sets to sorted Arrays for determinism
  const result = new Map();
  for (const [id, filesSet] of evidence.entries()) {
    result.set(id, Array.from(filesSet).sort());
  }
  return result;
}

function main() {
  const repoRoot = getRepoRoot();

  // 1. Load Core IDs
  const specAnchorsPath = path.join(repoRoot, "packages/rules/src/spec-anchors.generated.json");
  if (!fs.existsSync(specAnchorsPath)) {
    console.error("Error: spec-anchors.generated.json not found. Run pnpm gen:spec-anchors first.");
    process.exit(1);
  }
  const specData = JSON.parse(fs.readFileSync(specAnchorsPath, "utf8"));
  const coreIds = specData.anchors
    .filter(a => a.source === CORE_SOURCE)
    .map(a => a.id)
    .sort();

  // 2. Load Exemptions
  const exemptionsPath = path.join(repoRoot, "docs/architecture/CORE-01-SPEC-ONLY.json");
  let exemptIds = [];
  if (fs.existsSync(exemptionsPath)) {
    const exemptData = JSON.parse(fs.readFileSync(exemptionsPath, "utf8"));
    exemptIds = (exemptData.exemptIds || []).sort();
  }

  // 3. Collect Implementation Evidence
  const srcFiles = getAllFiles(path.join(repoRoot, "packages/game/src"), [".ts", ".tsx"]);
  const implementationEvidence = collectEvidence(srcFiles, `@rule\\s+(${RULE_ID_PATTERN})`, repoRoot);

  // 4. Collect Test Evidence
  const testDirs = [
    path.join(repoRoot, "packages/game/test"),
    path.join(repoRoot, "packages/integration-tests/test")
  ];
  const testFiles = testDirs.flatMap(dir => getAllFiles(dir, [".ts", ".tsx", ".js", ".mjs"]));
  // For tests, we accept @rule or just the ID
  const testEvidence = collectEvidence(testFiles, `(?:@rule\\s+)?(${RULE_ID_PATTERN})`, repoRoot);

  // 5. Build Report
  const report = {
    generatedAt: new Date().toISOString(), // This makes it not byte-stable if not careful, but task says "byte-stable report output"
    // Wait, "determinism: stable sorting, no time/random, byte-stable report output"
    // So I should probably omit or fix generatedAt.
    summary: {
      totalCoreIds: coreIds.length,
      implemented: 0,
      tested: 0,
      exempt: exemptIds.length,
      missingImplementation: 0,
      missingTest: 0,
    },
    coverage: {
      implementedIds: [],
      testedIds: [],
      exemptIds: exemptIds,
      missingImplementationIds: [],
      missingTestIds: [],
    },
    evidence: {}
  };

  // Remove generatedAt to ensure byte-stability as per GR-003 and task constraints
  delete report.generatedAt;

  for (const id of coreIds) {
    const isExempt = exemptIds.includes(id);
    const isImplemented = implementationEvidence.has(id);
    const isTested = testEvidence.has(id);

    if (isImplemented) {
      report.coverage.implementedIds.push(id);
      report.evidence[id] = report.evidence[id] || {};
      report.evidence[id].implementation = implementationEvidence.get(id);
    } else if (!isExempt) {
      report.coverage.missingImplementationIds.push(id);
    }

    if (isTested) {
      report.coverage.testedIds.push(id);
      report.evidence[id] = report.evidence[id] || {};
      report.evidence[id].test = testEvidence.get(id);
    } else if (!isExempt) {
      report.coverage.missingTestIds.push(id);
    }
  }

  report.summary.implemented = report.coverage.implementedIds.length;
  report.summary.tested = report.coverage.testedIds.length;
  report.summary.missingImplementation = report.coverage.missingImplementationIds.length;
  report.summary.missingTest = report.coverage.missingTestIds.length;

  // Final sort of everything for determinism
  report.coverage.implementedIds.sort();
  report.coverage.testedIds.sort();
  report.coverage.missingImplementationIds.sort();
  report.coverage.missingTestIds.sort();

  // Evidence map is already sorted keys because we iterate coreIds (sorted)
  // and values were sorted in collectEvidence.

  const reportPath = path.join(repoRoot, "docs/architecture/core-coverage.report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("Core Rule Coverage Audit Results:");
  console.log(`  Total Core IDs: ${report.summary.totalCoreIds}`);
  console.log(`  Implemented:    ${report.summary.implemented}`);
  console.log(`  Tested:         ${report.summary.tested}`);
  console.log(`  Exempt:         ${report.summary.exempt}`);
  console.log(`  Missing Impl:   ${report.summary.missingImplementation}`);
  console.log(`  Missing Test:   ${report.summary.missingTest}`);
  console.log(`\nReport written to ${normalizePath(path.relative(repoRoot, reportPath))}`);
}

main();
