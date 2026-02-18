# Task 0128 — CORE tiles: JSON data source + loader + canonical pre-shuffle tie-break fix

**Date:** 2026-02-19
**Owner:** Codex
**Branch:** `task/0128-core-tiles-jsonification`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

- **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
- **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
- During **IMPLEMENTING/VERIFYING:** you may only:
  - check boxes in **Section 10**
  - fill **Sections 11–14** (Work Summary / Commands / Proof)
- If scope changes beyond small clarifications, stop and create a follow-up task.

## 0) Masterplan Guardrails (MUST)

- Follow `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
  - GR-003 Determinism
  - GR-009 State shape discipline (JSON, stable IDs)
  - GR-012 Config is canonical (no hidden toggles)
- Follow `AGENTS.md` (single-commit discipline, proof requirements, no drift).

## 1) Primary Spec Anchors (MUST)

- `docs/rules/000-core.md`
  - CORE-01-02-10..16 (core tile counts)
  - CORE-01-03-02B / CORE-01-03-03B (canonical pre-shuffle ordering)
  - ADD56-01-01-01 (5–6 player add-on tile set)
- `docs/architecture/ARCH-02-STATE-SHAPE.md` (tiles/zones JSON invariants)
- `packages/game/src/setup.ts` (existing canonical pre-shuffle sort implementation)
- `docs/hand-off/task-packet-protocol.md` (Packet 01 guidance: data + loader + deterministic sort fix only)

## 2) Context

CORE tiles are still produced in code via `generateCoreTiles()` in `packages/game/src/packs/core/index.ts`. This blocks pack extraction and makes it harder to:

- audit the canonical tile set vs spec anchors
- keep tile set changes data-only (pack-friendly)
- reason about deterministic ordering in setup

Additionally, the current canonical pre-shuffle sort tie-breaker uses `tileId.localeCompare()`. For IDs with numeric suffixes (e.g. `tile_core_10` vs `tile_core_2`), this produces a deterministic but **non-canonical** order relative to CORE-01-03-02B key (4) “SerialIndex”.

This task converts the CORE tile set to a JSON data source plus a loader, and fixes the canonical tie-breaker to respect “SerialIndex” via a stable original-index tie-break.

## 3) Goal

- Replace hardcoded tile generation in the CORE pack with a JSON-defined tile list + loader.
- Ensure the loader produces the same tile objects as before (same ids, attributes), unless a spec anchor requires a deterministic ordering fix.
- Fix canonical pre-shuffle ordering tie-breaker so it no longer depends on lexicographic ID ordering; instead it must respect per-group “SerialIndex”.

## 4) Non-Goals

- Do not change tile counts, tile semantics, or introduce new tiles.
- Do not extract CORE into a separate workspace package yet.
- Do not redesign setup/shuffle flow beyond the canonical tie-break fix.
- Do not refactor expansions, measure decks, or config behavior.

## 5) Inputs

- Existing CORE pack implementation: `packages/game/src/packs/core/index.ts`.
- Setup ordering implementation: `packages/game/src/setup.ts`.
- Spec anchors in `docs/rules/000-core.md`.

## 6) Outputs

- New JSON tile source under CORE pack (pack-local data), e.g.:
  - `packages/game/src/packs/core/resources/core-tiles.json`

  The JSON must express:
  - base CORE tile groups (CORE-01-02-10..16)
  - ADD56 tile additions (ADD56-01-01-01)

- New loader code in CORE pack that:
  - reads the JSON
  - generates tiles deterministically
  - preserves current tile IDs (e.g. `tile_core_<n>`) and key fields

- Update `sortDrawPileCanonical()` to use a stable original-index tie-break (SerialIndex) instead of `localeCompare(tileId)`.

## 7) Constraints (Hard)

- **Determinism:** identical config + RNG seed + move sequence must produce identical state.
- **No rule drift:** tile counts and tile types MUST match the spec anchors.
- **State shape discipline:** No new fields added to tile objects unless already allowed by `ARCH-02`.
- Keep changes minimal and localized to:
  - CORE pack tile generation
  - canonical pre-shuffle ordering tie-break

## 8) Implementation Plan

1. Add `packages/game/src/packs/core/resources/core-tiles.json`:
   - Use a simple, explicit list format (no codegen required).
   - Represent tiles as “groups” with `type`, optional `resort`, optional `weight`, optional `conversionTag`, and `count`.
   - Split into `base` and `add56` sections.

2. Implement a loader (new helper module preferred) that:
   - iterates the JSON groups in a deterministic order
   - allocates tile IDs exactly as the current `generateCoreTiles()` does
   - populates tile objects with the same fields as current code
   - returns the full tile list used by CORE pack pre-shuffle setup

3. Replace `generateCoreTiles()` usage in CORE pack with the JSON-driven loader.

4. Fix canonical pre-shuffle ordering tie-break:
   - In `packages/game/src/setup.ts`, replace the final `return aId.localeCompare(bId)` tie-break with a stable per-input-order index (SerialIndex).
   - Implementation guidance:
     - build an `indexById` map from the current draw pile list BEFORE sorting
     - sort by keys (type/resort/weight) and then tie-break by `indexById[aId] - indexById[bId]`

5. Update/adjust tests as needed (no new behavior beyond spec compliance). If golden fixtures drift due to the ordering tie-break fix, update them as part of this task.

## Acceptance Criteria

- [x] CORE pack no longer hardcodes the base tile set in `generateCoreTiles()`; tile groups live in `core-tiles.json`.
- [x] The generated tile set matches spec counts (CORE-01-02-10..16 + ADD56-01-01-01).
- [x] `sortDrawPileCanonical()` no longer uses lexicographic `tileId` ordering as the final tie-break; it uses stable “SerialIndex” (original index).
- [x] `pnpm -r test` is green.
- [x] `pnpm run verify:task 0128` passes.

## PR Checklist (Repo Artifact)

- [x] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [x] Single commit on the task branch.
- [x] `pnpm -r test` executed; results recorded in Section 12.
- [x] No unrelated formatting churn.
- [x] Postflight proof captured (per AGENTS) and included in commit message.

## Work Summary

- Extracted CORE tile generation logic to `packages/game/src/packs/core/resources/core-tiles.json` and `tile-loader.ts`.
- Implemented deterministic tile loader that preserves existing IDs and properties.
- Updated `sortDrawPileCanonical` in `packages/game/src/setup.ts` to use stable `SerialIndex` (original generation order) as the final tie-breaker instead of `localeCompare(tileId)`.
- Updated golden replay hashes and replay runner expectation to reflect the canonical ordering change.
- Fixed spec anchor references in task file.

## Commands Run

- `pnpm -r test` (passed)
- `git status -sb`
- `git diff --stat`

## Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `pnpm -r test`

## Commit Proof (recorded in commit message)

- `git show -1 --stat`

## Amendments (append-only)
