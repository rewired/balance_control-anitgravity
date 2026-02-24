#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SPEC_PATH = "docs/rules/000-core.md";
const REGISTRY_PATH = "docs/architecture/CORE-01-OBLIGATIONS.json";
const REPORT_PATH = "docs/architecture/core-obligations.report.json";

export function getRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..");
}

/**
 * quality signal: normative obligations require executable evidence
 * (tests/invariants/golden), not file references alone.
 */
export function isExecutableEvidence(evidencePath) {
    const p = evidencePath.toLowerCase();
    // 1. Test files
    if (p.endsWith(".test.ts") || p.endsWith(".test.mjs") || p.endsWith(".test.js")) return true;
    // 2. Invariants
    if (p.includes("invariant") && (p.endsWith(".ts") || p.endsWith(".mjs") || p.endsWith(".js"))) return true;
    // 3. Golden fixtures
    if (p.endsWith(".json") && p.includes("/golden/")) return true;

    return false;
}

function parseSpec(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const specEntries = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(CORE-01-\d{2}-[\d\w.-]+)\s+(.*)$/);
    if (match) {
      const id = match[1];
      const text = match[2].trim();
      specEntries.set(id, text);
    }
  }
  return specEntries;
}

export function validateRegistry(registry, specEntries) {
  const registryIds = new Set(registry.entries.map(e => e.id));
  const specIds = new Set(specEntries.keys());

  const missingInRegistry = Array.from(specIds).filter(id => !registryIds.has(id)).sort();
  const extraInRegistry = Array.from(registryIds).filter(id => !specIds.has(id)).sort();

  const invalidEntries = [];
  const normativeMissingEvidence = [];
  const weakEvidence = [];
  const evidenceOrphans = [];

  const totalsByClass = {
    NORMATIVE_ENGINE: 0,
    NORMATIVE_STATE: 0,
    NORMATIVE_DATA: 0,
    NORMATIVE_UI: 0,
    INFORMATIVE: 0,
    DERIVED: 0,
  };

  const qualityStats = {
      OK: 0,
      WEAK: 0,
      MISSING: 0,
      SUSPECT: 0, // Entries with at least one orphan
  };

  const seenIds = new Set();
  const duplicateIds = [];

  const repoRoot = getRepoRoot();

  for (const entry of registry.entries) {
    if (seenIds.has(entry.id)) {
      duplicateIds.push(entry.id);
      continue;
    }
    seenIds.add(entry.id);

    if (totalsByClass[entry.class] !== undefined) {
      totalsByClass[entry.class]++;
    }

    // Validation rules from Section 6
    if (!["NORMATIVE_ENGINE", "NORMATIVE_STATE", "NORMATIVE_DATA", "NORMATIVE_UI", "INFORMATIVE", "DERIVED"].includes(entry.class)) {
      invalidEntries.push({ id: entry.id, reason: `Invalid class: ${entry.class}` });
    }

    let hasOrphan = false;
    if (Array.isArray(entry.evidence)) {
      for (const ev of entry.evidence) {
        if (typeof ev === "string") {
            const fullPath = path.join(repoRoot, ev.split(":")[0]);
            if (!fs.existsSync(fullPath)) {
                evidenceOrphans.push({ id: entry.id, evidence: ev });
                hasOrphan = true;
            }
        }
      }
    }

    if (entry.class.startsWith("NORMATIVE_")) {
      if (entry.evidenceRequired !== true) {
        invalidEntries.push({ id: entry.id, reason: "NORMATIVE_* must have evidenceRequired=true" });
      }

      const hasEvidence = Array.isArray(entry.evidence) && entry.evidence.length > 0;

      if (!hasEvidence) {
        normativeMissingEvidence.push(entry.id);
        qualityStats.MISSING++;
      } else {
        const hasExecutable = entry.evidence.some(ev => isExecutableEvidence(ev));
        if (!hasExecutable) {
            weakEvidence.push(entry.id);
            qualityStats.WEAK++;
        } else {
            qualityStats.OK++;
        }
      }
    }

    if (hasOrphan) {
        qualityStats.SUSPECT++;
    }

    if (entry.class === "INFORMATIVE") {
      if (entry.evidenceRequired !== false) {
        invalidEntries.push({ id: entry.id, reason: "INFORMATIVE must have evidenceRequired=false" });
      }
      if (!entry.notes) {
        invalidEntries.push({ id: entry.id, reason: "INFORMATIVE must have non-empty notes" });
      }
    } else if (entry.class === "DERIVED") {
      if (entry.evidenceRequired !== false) {
        invalidEntries.push({ id: entry.id, reason: "DERIVED must have evidenceRequired=false" });
      }
      if (!entry.derivedFrom) {
        invalidEntries.push({ id: entry.id, reason: "DERIVED must have non-empty derivedFrom" });
      }
      if (!entry.notes) {
        invalidEntries.push({ id: entry.id, reason: "DERIVED must have non-empty notes explaining derivation" });
      }
    }
  }

  return {
    totalsByClass,
    qualityStats,
    missingInRegistry,
    extraInRegistry,
    duplicateIds,
    invalidEntries,
    normativeMissingEvidence: normativeMissingEvidence.sort(),
    weakEvidence: weakEvidence.sort(),
    evidenceOrphans: evidenceOrphans.sort((a,b) => a.id.localeCompare(b.id)),
  };
}

function main() {
  const repoRoot = getRepoRoot();
  const specEntries = parseSpec(path.join(repoRoot, SPEC_PATH));

  if (!fs.existsSync(path.join(repoRoot, REGISTRY_PATH))) {
    console.error(`Registry not found at ${REGISTRY_PATH}. Please bootstrap it first.`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, REGISTRY_PATH), "utf8"));
  const auditResult = validateRegistry(registry, specEntries);

  const report = {
    spec: registry.spec,
    summary: {
      totalSpecIds: specEntries.size,
      totalRegistryEntries: registry.entries.length,
      totalsByClass: auditResult.totalsByClass,
      qualityStats: auditResult.qualityStats,
    },
    results: {
      missingInRegistry: auditResult.missingInRegistry,
      extraInRegistry: auditResult.extraInRegistry,
      duplicateIds: auditResult.duplicateIds,
      invalidEntries: auditResult.invalidEntries,
      normativeMissingEvidence: auditResult.normativeMissingEvidence,
      weakEvidence: auditResult.weakEvidence,
      evidenceOrphans: auditResult.evidenceOrphans,
    }
  };

  fs.writeFileSync(path.join(repoRoot, REPORT_PATH), JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("Audit complete.");
  console.log(`Spec IDs: ${specEntries.size}`);
  console.log(`Registry Entries: ${registry.entries.length}`);
  console.log("Class breakdown:", report.summary.totalsByClass);
  console.log("Quality stats:", report.summary.qualityStats);

  const hasErrors =
    auditResult.missingInRegistry.length > 0 ||
    auditResult.extraInRegistry.length > 0 ||
    auditResult.invalidEntries.length > 0 ||
    auditResult.duplicateIds.length > 0 ||
    auditResult.normativeMissingEvidence.length > 0 ||
    auditResult.weakEvidence.length > 0 ||
    auditResult.evidenceOrphans.length > 0;

  if (hasErrors) {
    console.warn("\nIssues found:");
    if (auditResult.missingInRegistry.length > 0) console.warn(`- Missing in registry: ${auditResult.missingInRegistry.length}`);
    if (auditResult.extraInRegistry.length > 0) console.warn(`- Extra in registry: ${auditResult.extraInRegistry.length}`);
    if (auditResult.duplicateIds.length > 0) console.warn(`- Duplicate IDs in registry: ${auditResult.duplicateIds.length}`);
    if (auditResult.invalidEntries.length > 0) console.warn(`- Invalid entries: ${auditResult.invalidEntries.length}`);
    if (auditResult.normativeMissingEvidence.length > 0) console.warn(`- Normative entries missing evidence: ${auditResult.normativeMissingEvidence.length}`);
    if (auditResult.weakEvidence.length > 0) console.warn(`- Normative entries with WEAK evidence: ${auditResult.weakEvidence.length}`);
    if (auditResult.evidenceOrphans.length > 0) console.warn(`- Evidence orphans (SUSPECT): ${auditResult.evidenceOrphans.length}`);
    process.exit(1);
  } else {
    console.log("\nRegistry is consistent and all normative obligations have STRONG evidence.");
  }
}

const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
