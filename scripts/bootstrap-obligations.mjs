#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SPEC_PATH = "docs/rules/000-core.md";
const OUTPUT_PATH = "docs/architecture/CORE-01-OBLIGATIONS.json";

function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

function main() {
  const repoRoot = getRepoRoot();
  const specFilePath = path.join(repoRoot, SPEC_PATH);
  const content = fs.readFileSync(specFilePath, "utf8");
  const lines = content.split(/\r?\n/);

  const entries = [];
  const seenIds = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(CORE-01-\d{2}-[\d\w.-]+)\s+(.*)$/);
    if (match) {
      const id = match[1];
      const text = match[2].trim();
      if (!seenIds.has(id)) {
        entries.push({
          id,
          text,
          class: "TODO",
          evidenceRequired: false,
          evidence: [],
          notes: ""
        });
        seenIds.add(id);
      }
    }
  }

  const output = {
    schema_version: "1.0",
    spec: {
      path: SPEC_PATH,
      version: "v1.1.0"
    },
    entries: entries.sort((a, b) => a.id.localeCompare(b.id))
  };

  fs.writeFileSync(path.join(repoRoot, OUTPUT_PATH), JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Bootstrapped ${entries.length} entries to ${OUTPUT_PATH}`);
}

main();
