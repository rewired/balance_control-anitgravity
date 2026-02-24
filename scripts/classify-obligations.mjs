#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "docs/architecture/CORE-01-OBLIGATIONS.json";

function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

function classify(id, text) {
  if (text.toLowerCase().includes("reserved")) {
    return { class: "INFORMATIVE", notes: "Reserved for future use." };
  }

  const parts = id.split("-");
  if (parts.length === 3) {
      return { class: "INFORMATIVE", notes: "Section header." };
  }

  const section = parts[2]; // e.g. "00"

  if (text.includes("is derived from") || text.includes("refer to")) {
      return { class: "DERIVED", derivedFrom: "CORE-01-00", notes: "Explicitly derived or cross-reference." };
  }

  switch (section) {
    case "00":
      if (id.includes("-T")) {
          if (text.includes("may represent") || text.includes("does not alter")) {
              return { class: "INFORMATIVE", notes: "Permissive or descriptive topology note." };
          }
          return { class: "NORMATIVE_ENGINE", evidenceRequired: true };
      }
      if (text.includes("Invariant")) return { class: "NORMATIVE_STATE", evidenceRequired: true };
      return { class: "NORMATIVE_STATE", evidenceRequired: true };
    case "01":
      if (id === "CORE-01-01-03" || id === "CORE-01-01-04") {
          return { class: "NORMATIVE_ENGINE", evidenceRequired: true };
      }
      return { class: "INFORMATIVE", notes: "Foundational principle." };
    case "02":
      if (text.includes("contains exactly") || text.includes("defines exactly")) {
          return { class: "NORMATIVE_DATA", evidenceRequired: true };
      }
      if (text.includes("Ownership") || text.includes("belongs to")) {
          return { class: "NORMATIVE_STATE", evidenceRequired: true };
      }
      return { class: "NORMATIVE_STATE", evidenceRequired: true };
    case "03":
    case "04":
    case "05":
    case "06":
    case "07":
    case "08":
    case "09":
      return { class: "NORMATIVE_ENGINE", evidenceRequired: true };
    case "10":
      return { class: "DERIVED", derivedFrom: "CORE-01-00", notes: "Rule hierarchy meta-rule." };
    default:
      return { class: "INFORMATIVE", notes: "Unclassified." };
  }
}

function main() {
  const repoRoot = getRepoRoot();
  const registryPath = path.join(repoRoot, REGISTRY_PATH);
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

  for (const entry of registry.entries) {
    const result = classify(entry.id, entry.text);
    entry.class = result.class;
    entry.evidenceRequired = result.evidenceRequired || false;
    entry.notes = result.notes || "";
    if (result.derivedFrom) {
        entry.derivedFrom = result.derivedFrom;
    } else {
        delete entry.derivedFrom;
    }
    // Preserving existing evidence if any
    if (!entry.evidence) entry.evidence = [];
  }

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(`Classified ${registry.entries.length} entries.`);
}

main();
