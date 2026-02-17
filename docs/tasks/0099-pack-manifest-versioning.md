# Codex Task 0099 - Pack Manifest + Versioning (Semver + Ruleset Anchors)

**Date:** 2026-02-17  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

---

## Goal

Introduce a strict, explicit **Pack Manifest** contract so packs become:
- identifiable
- versioned (semver)
- tied to a ruleset anchor (spec + version)

This is prerequisite for replay safety and migrations.

---

## Inputs

- CorePack exists.
- Expansion packs exist (Task 0098).

---

## Outputs

### A) Define `PackManifest` type (engine)

Add/extend a type in engine (choose canonical location; likely near pack registry):

Required fields:
- `id`: string (stable pack identifier, e.g. `core`, `exp-01`, `exp-02`, `exp-03`)
- `packVersion`: string (semver, e.g. `1.1.0`)
- `rulesetAnchor`: string (human-readable, e.g. `CORE-01 v1.1.0`, `EXP-01 v1.3.0`)
- `required`: boolean (true for Core, false for optional expansions)

Optional but recommended:
- `requires`: { core: string } (semver range, e.g. `^1.1.0`)
- `compatibleWith`: string[] (pack IDs) or a structured compatibility matrix if already present

### B) Registry exposes manifests

`EnginePackRegistry` must be able to return:
- list of all registered pack manifests (deterministic order)
- a helper to validate a requested enabled-pack set:
  - Core is always enabled
  - unknown pack ids -> fail fast
  - missing required packs -> fail fast
  - incompatible versions -> fail fast (if `requires` is implemented)

### C) Match config schema

Where match configuration is represented (server/lobby or game setup), define a clear schema:
- enabledPacks: list of pack IDs (without core)
- optionally: pinned versions (if the UI/server supports it; otherwise engine will resolve to the registered versions)

If schema already exists, migrate it to the manifest-driven approach.

---

## Constraints

- Deterministic ordering: manifests must be returned in a stable, canonical order (e.g., by `id` then `packVersion`).
- No runtime “guessing”: if a pack is requested but not registered, hard fail.

---

## Invariants

- Core is required and cannot be disabled.
- Each pack has exactly one manifest (no duplicates).
- The set of enabled packs is validated before the game begins.

---

## Acceptance Criteria

- There is a single source of truth for pack identity/version/anchor: `PackManifest`.
- Starting a match with an unknown pack id fails with a clear error.
- Starting a match without core is impossible (engine-enforced).
- A small unit test proves:
  - core required enforcement
  - unknown pack id rejection
  - deterministic ordering of manifest list

---

## PR Checklist

- [ ] `PackManifest` type added and used by all packs
- [ ] Registry validates enabled packs using manifests
- [ ] Config schema defined/migrated
- [ ] Tests added for validation + ordering
- [ ] Meaningful commit message, e.g. `engine: add pack manifest contract and validation`
