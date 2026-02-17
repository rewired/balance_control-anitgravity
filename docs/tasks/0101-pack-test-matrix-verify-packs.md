# Codex Task 0101 - Pack Tooling + Test Matrix (Golden Replays + verify-packs)

**Date:** 2026-02-17  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

---

## Goal

Replace “seems to work” with a CI-proof safety net:

1) A small test matrix of golden replays (core-only and expansion combos)
2) A tooling check `verify-packs` to detect drift:
   - duplicate IDs
   - non-canonical assembly order
   - missing/invalid manifests
   - surface hash instability

---

## Inputs

- Packs are first-class and have manifests (Tasks 0097-0100).

---

## Outputs

### A) Golden replays (minimum set)

Add golden replays (or deterministic scripted matches) for:
- core-only
- core + exp-01
- core + exp-02
- core + exp-03
- (if expansions are compatible together in your codebase) at least one multi-expansion combo:
  - core + exp-01 + exp-02
  - core + exp-01 + exp-03
  - core + exp-01 + exp-02 + exp-03 (only if supported and intended)

Each golden should assert:
- final state hash (or a stable snapshot) matches
- `publicSurfaceHash` matches expected for that pack set
- no runtime warnings/errors

### B) Registry invariants tests

Add unit tests for pack registry:
- canonical assembly order is stable
- duplicates are rejected
- enabled pack validation behaves correctly

### C) `verify-packs` script

Add a Node script (example: `scripts/verify-packs.mjs`) and wire into CI or existing verify tooling.

It should:
- load the engine pack registry in a clean node process
- assemble the surface for:
  - core-only
  - each single expansion
  - (optional) relevant combos
- for each assembly, validate:
  - no duplicate move ids / atom ids
  - manifests present and consistent
  - surface hash stable across two consecutive runs in the same process (sanity)
- exit non-zero on any failure

Add a `package.json` script entry:
- `verify:packs` -> runs the script

(If repo already has `verify-task.mjs`, integrate into that pipeline instead of adding a parallel check.)

---

## Constraints

- Golden tests must be deterministic and not depend on wall-clock time.
- Keep runtime fast; do not generate 100-match suites.
- Avoid snapshot noise; store stable, minimal fixtures.

---

## Invariants

- Drift in pack assembly is caught immediately by CI:
  - duplicates
  - ordering changes
  - manifest inconsistencies
  - surface hash mismatch

---

## Acceptance Criteria

- `pnpm verify:packs` (or equivalent) exists and fails correctly when you introduce a deliberate duplicate id (local test).
- Golden replay suite covers at least the 4 single-pack scenarios listed above.
- CI (or local `pnpm test`) includes the pack tooling and matrix.

---

## PR Checklist

- [ ] Golden replays added for core-only and each single expansion
- [ ] Registry invariant tests added
- [ ] `verify:packs` script implemented and wired into scripts/CI
- [ ] All tests pass locally
- [ ] Meaningful commit message, e.g. `test: add pack matrix and verify-packs tooling`
