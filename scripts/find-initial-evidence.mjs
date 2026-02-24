#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "docs/architecture/CORE-01-OBLIGATIONS.json";
const SEARCH_PATHS = [
  "packages/game/src",
  "packages/game/test",
  "packages/integration-tests/test/golden"
];

function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && !file.startsWith('.')) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function main() {
  const repoRoot = getRepoRoot();
  const registryPath = path.join(repoRoot, REGISTRY_PATH);
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

  const allFiles = [];
  for (const p of SEARCH_PATHS) {
    getAllFiles(path.join(repoRoot, p), allFiles);
  }

  const evidenceMap = new Map(); // id -> set of files

  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = path.relative(repoRoot, file).split(path.sep).join("/");

    for (const entry of registry.entries) {
      if (content.includes(entry.id)) {
        if (!evidenceMap.has(entry.id)) {
          evidenceMap.set(entry.id, new Set());
        }
        evidenceMap.get(entry.id).add(relativePath);
      }
    }
  }

  let matched = 0;
  for (const entry of registry.entries) {
    if (entry.class.startsWith("NORMATIVE_")) {
      const files = evidenceMap.get(entry.id);
      if (files) {
        entry.evidence = Array.from(files).sort().slice(0, 3); // Take up to 3 for now
        matched++;
      } else {
          // If no evidence found, add a placeholder to satisfy the hard constraint
          // but we should probably find real ones.
          // For now, let's see how many are missing.
      }
    }
  }

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(`Matched evidence for ${matched} / ${registry.entries.filter(e => e.class.startsWith("NORMATIVE_")).length} normative entries.`);
}

main();
