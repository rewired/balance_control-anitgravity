#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RULE_ID_PATTERN = "\\b(?:CORE|EXP|VAR|ADD56)-\\d{2}(?:-(?:\\d{2}[A-Z]?|[A-Z]|T\\d{2}))+(?:\\.\\d+[A-Z]?)*\\b";

const RULE_FILES = [
  "docs/rules/000-core.md",
  "docs/rules/001-expansion01.md",
  "docs/rules/002-expansion02.md",
  "docs/rules/003-expansion03.md",
];

function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function collectAnchors(filePath, anchorsById) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const ruleIdRegex = new RegExp(RULE_ID_PATTERN, "g");
  const relativePath = normalizePath(path.relative(getRepoRoot(), filePath));

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matches = line.matchAll(ruleIdRegex);
    for (const match of matches) {
      const id = match[0];
      if (!anchorsById.has(id)) {
        anchorsById.set(id, {
          id,
          source: relativePath,
          line: index + 1,
        });
      }
    }
  }
}

function main() {
  const repoRoot = getRepoRoot();
  const anchorsById = new Map();
  const sources = [];

  for (const relativePath of RULE_FILES) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    sources.push(normalizePath(relativePath));
    collectAnchors(absolutePath, anchorsById);
  }

  const anchors = Array.from(anchorsById.values()).sort((a, b) => a.id.localeCompare(b.id));
  const output = {
    version: 1,
    sources: sources.sort((a, b) => a.localeCompare(b)),
    anchors,
  };

  const outputPath = path.join(repoRoot, "packages/rules/src/spec-anchors.generated.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${anchors.length} anchors to ${normalizePath(path.relative(repoRoot, outputPath))}.`);
}

main();
