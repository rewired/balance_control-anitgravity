# Task 0359 — Replay checkpoint board metrics invariants

**Date:** 2026-03-09  
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

* GR-001: checkpoint board metrics now derive directly from authoritative board zone state each emission; no cached counters persisted.
* GR-002: replay pipeline remains observational/invariant-only and does not execute legality/rule logic outside engine.
* GR-003: invariants are deterministic and based on canonical state reads.

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
* CORE-01-07-03D

---

## 2) Goal

* Compute checkpoint `boardTileCount` from canonical board zone authority.
* Remove/avoid non-authoritative cached board counters in checkpoint projection.
* Enforce settlement/checkpoint invariant: non-empty settlement tile projection implies positive board tile count.
* Add regression tests covering settlement tile set, action `targetTileId` referential validity, and checkpoint board metrics.

---

## 3) Non-Goals

* No gameplay-rule changes.
* No UI changes.

---

## 4) Inputs

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/server/src/replay-logging.test.ts`
* `docs/replay-format-v2.md`
* `docs/changelog.md`

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] task file updated in `/docs/tasks/`
* [ ] DD created (N/A)

---

## 6) Constraints (Hard)

* Deterministic only; no non-seeded randomness/time dependencies.
* Engine state remains authoritative.
* No temp files committed.

---

## 7) Invariants

* `system.roundSettlement.perTile.length > 0` => `checkpoint.roundEnd.global.boardTileCount > 0`.
* Checkpoint global board metrics reflect canonical board zone size.

---

## 8) Implementation Plan

* [x] Update replay checkpoint projection to read board tile count from canonical board zone constant.
* [x] Add replay settlement invariant at round checkpoint emission.
* [x] Extend regression tests for settlement/action-target/board-metrics consistency and invariant violation path.
* [x] Update replay docs/changelog.

---

## 9) Acceptance Criteria

* [x] `boardTileCount` is computed from authoritative board zone state each checkpoint.
* [x] Round-settlement invariant is enforced in replay pipeline.
* [x] Regression tests assert consistency among settlement tile set, action target tile reference, and checkpoint global metrics.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed/compliance documented
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved
* [ ] `pnpm lint` passes (N/A for this scoped change)
* [x] `pnpm vitest run` passes (targeted suites)
* [x] Determinism preserved
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated

---

## 11) Work Summary

* Switched replay `boardTileCount` derivation to canonical board zone reference (`CoreZoneName.Board`).
* Added round-settlement invariant check that rejects non-empty settlement projection with zero board tiles.
* Emitted round-end checkpoint `global` metrics for schema parity with turn-end checkpoints.
* Added regression tests for settlement/action-target/board-metric consistency and invariant-failure path.
* Updated replay format docs and changelog.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts` → pass
* `pnpm -C packages/game exec vitest run test/replay-verify.test.ts` → pass
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts`
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts`
* `git show -1 --stat`

---

## 15) Amendments (append-only)

* N/A
