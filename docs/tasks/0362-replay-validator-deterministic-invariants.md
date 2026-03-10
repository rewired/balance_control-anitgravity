# Task 0362 — Replay validator deterministic invariants

**Date:** 2026-03-10  
**Owner:** Codex  
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`  
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-002
* GR-003

### compliance_notes

* GR-001: validator recomputes checkpoint summaries and invariants from authoritative engine state snapshots; no derived caches persisted.
* GR-002: replay validator remains observational and fail-fast only; it does not execute or bypass gameplay rule legality logic outside engine execution.
* GR-003: all checks are deterministic projections over replayed seeded state and canonical board zone reads.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] Applied `SEC > DD > TDD > AGENTS > VISION`.
* [x] Class presence/absence documented: SEC present, DD present, TDD present, AGENTS present, VISION absent.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-01:STATE_AUTHORITY
* ARCH-01:DETERMINISM
* ARCH-02:ZONE_MODEL

---

## 2) Goal

* Extend replay verifier invariants for deterministic delta and tile-binding guarantees.
* Enforce fail-fast validation with contextual identifiers.
* Validate canonical replay fixtures in CI test runs.

---

## 3) Non-Goals

* No gameplay rules changes.
* No UI changes.

---

## 4) Inputs

* `packages/game/src/replay-verify.ts`
* `packages/game/test/replay-verify.test.ts`
* `docs/replay-format-v2.md`

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/replay-verify.ts`
* `packages/game/test/replay-verify.test.ts`
* `packages/game/test/replay-verify-fixtures.test.ts`
* `packages/game/test/fixtures/replay/canonical-core-place-tile.json`

### 5.2 Docs

* [x] `/docs/changelog.md` updated
* [x] task file updated in `/docs/tasks/`
* [x] DD updated/added (`/docs/design-decisions/DD-0362-replay-validator-deterministic-invariants.md`)

---

## 6) Constraints (Hard)

* Deterministic only; no time/random external entropy.
* Validator fails on first invariant breach.
* Error output includes record index plus key identifiers when available.

---

## 7) Invariants

* `placeInfluence(applied)` → `personalSupply -1`, `board +1`.
* `moveInfluence(applied)` preserves board influence total and source/target tile binding deltas.
* `system.roundSettlement.perTile.length > 0` → `boardTileCount > 0`.
* Required `intent.*tileId` style bindings must map to tiles in Board zone.
* `checkpoint.*` summaries are recomputed from authoritative state for parity checks.

---

## 8) Implementation Plan

* [x] Add fail-fast verifier context helper carrying record index + key ids.
* [x] Add deterministic invariants for applied place/move influence records.
* [x] Add intent target tile Board-zone validation for required move types.
* [x] Enforce settlement-perTile vs boardTileCount invariant in verifier.
* [x] Add canonical replay fixture tests run by package test script.
* [x] Update replay docs/changelog and record DD.

---

## 9) Acceptance Criteria

* [x] Verifier fails immediately on first invariant violation.
* [x] Failure message includes record index and contextual identifiers.
* [x] Replay canonical fixture validation runs in standard test pipeline.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed/compliance documented
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved
* [ ] `pnpm lint` passes (N/A scoped task)
* [x] `pnpm test` passes
* [x] Determinism preserved
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated

---

## 11) Work Summary

* Extended replay verifier with contextual fail-fast errors including `recordIndex`, `seq`, `turn`, `round`, `tileId`, `player` fields where available.
* Added deterministic invariants for applied influence transitions and Board-zone tile binding checks.
* Enforced round-settlement perTile/boardTileCount invariant in verifier.
* Added canonical replay fixture loading/validation tests so CI verifies fixtures every run.
* Added DD-0362 and replay format/changelog updates.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-verify.test.ts test/replay-verify-fixtures.test.ts` → pass
* `pnpm -C packages/game test` → pass

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/game exec vitest run test/replay-verify.test.ts test/replay-verify-fixtures.test.ts`
* `pnpm -C packages/game test`
* `git show -1 --stat`

---

## 15) Amendments (append-only)

* N/A
