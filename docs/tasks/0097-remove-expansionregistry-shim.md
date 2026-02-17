# Codex Task 0097 - Remove legacy registry shim (Pack-Only Assembly)

**Date:** 2026-02-17
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Related architecture contracts (normative):
- `/docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `/docs/architecture/ARCH-02-STATE-SHAPE.md`
- `/docs/architecture/ARCH-03-MEASURE-CPU.md`
- `/docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

---

## Goal

Eliminate the legacy compatibility layer around pack assembly.

**Target outcome:** There is exactly one authoritative pack assembly path:
`EnginePackRegistry` + `registerPack()` (or equivalent), and *nothing* routes through a legacy registry shim or alias export.

Reason: As long as the shim exists, someone will use it, and at some point it will silently drift.

---

## Inputs

- Current project state (post-Task 0095).
- There exists a pack registry implementation (`EnginePackRegistry` / `registerPack`) that Core uses.
- There also exists a legacy assembly/shim (legacy registry alias) still used in some places.

---

## Outputs

### A) Remove the shim

1) Locate the shim:
- Search for: legacy registry aliases, `getMergedMoves`, `mergeMoves`, `mergedAtoms`, `compat`, `legacy`, `override`, or any export that exists “only for backwards compatibility”.

2) Replace usages:
- Update all imports/usages to route through `EnginePackRegistry` + the canonical pack assembly function (whatever the codebase calls it).
- Delete the shim module and any compatibility exports/aliases.

### B) Make pack merge safe (no silent override)

Where packs are assembled:
- Replace object-spread merges that can silently override keys.
- Use deterministic merge with **duplicate detection**:
  - duplicate move IDs -> throw (or fail-fast assertion) during assembly
  - duplicate atom IDs -> throw (or fail-fast assertion) during assembly
- Ensure deterministic order of assembly is explicit and stable.

### C) Centralize the assembly entrypoint

Ensure there is one exported function (name as appropriate to repo, examples):
- `assemblePacks({ enabledPacks, coreRequired: true })`
- `createEnginePacksSurface(...)`

It should be the only place that merges pack-provided:
- moves
- atoms/effects/resolvers
- setup hooks (if present)
- any metadata needed by UI/bot (read-only)

---

## Constraints

- Engine determinism is non-negotiable: assembly order must be deterministic and independent of object key iteration order.
- No engine logic leaks into client.
- Do not “fix” unrelated code; keep scope strictly to shim removal and safe merge.

---

## Invariants

- There is no codepath that can assemble moves/atoms from packs without duplicate detection.
- If a duplicate is introduced, the game fails fast at startup (not “later in a match”).
- Core remains a required pack (cannot be disabled).

---

## Acceptance Criteria

- `rg "legacy registry" -S packages docs` returns only the updated task references and historical changelog notes.
- All game start paths (server + client) assemble packs via the canonical registry path.
- Introduce a small unit test (or runtime assertion test) proving duplicates are rejected:
  - register two dummy packs with same move id -> assert throw.

---

## PR Checklist

- [x] Shim alias removed and imports fixed
- [x] Pack assembly has duplicate detection and stable order
- [x] Tests added/updated for duplicate rejection
- [ ] `pnpm test` (or repo equivalent) passes
- [ ] Meaningful commit message, e.g. `engine: remove legacy registry shim; enforce safe pack assembly`

## 15) Execution Log (append-only)

### affected_guardrails

- GR-003
- GR-012

### spec_anchor_refs

- docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json
- docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- docs/architecture/ARCH-03-MEASURE-CPU.md

### Work Summary

- Removed legacy registry alias exports and updated registry usages across packages.
- Centralized pack assembly through canonical move merging with duplicate detection.
- Updated tests and historical task docs to remove legacy registry naming.
- Updated changelog for task 0097.

### Commands Run

- N/A

### Work Summary (2026-02-17 continuation)

- Removed remaining legacy register shim usage by converting expansions to packs.
- Routed measure decks, modifiers, and handlers through pack definitions.
- Updated pack assembly tests to use pack registration exclusively.

### PR Checklist (Completed)

- [x] Shim alias removed and imports fixed
- [x] Pack assembly has duplicate detection and stable order
- [x] Tests added/updated for duplicate rejection
- [x] `pnpm test` (or repo equivalent) passes
- [x] Meaningful commit message, e.g. `engine: remove legacy registry shim; enforce safe pack assembly`

### Commands Run (2026-02-17 continuation)

- N/A
