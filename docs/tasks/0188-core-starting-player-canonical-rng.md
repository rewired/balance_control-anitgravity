# Task 0188 — CORE: Starting player is determined by canonical RNG call and drives turn order + handicap

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0188-core-starting-player-canonical-rng`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S04 (Determinism Check), S07 (Golden Tests), S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-003

### compliance_notes
* GR-003: Use the existing seeded RNG to pick starting player immediately after shuffle; do not add additional RNG consumption.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-03-02A.2 (Canonical RNG Call Order: shuffle first, then `k = RNG.nextInt(playerCount)`)
* CORE-01-03-02 (Setup order: shuffle; determine starting player; assign starting influence; apply FirstPlayerHandicap)
* VAR-01-02-02 (FirstPlayerHandicap: starting player receives one fewer Starting Influence)
* VAR-01-02-03 (Reduction applies after standard starting influence assignment)

---

## 2) Goal

* Persist the canonical starting seat index `k` from setup (0..numPlayers-1) in state.
* Make boardgame.io turn order start at that player deterministically.
* Ensure FirstPlayerHandicap is applied to the **actual starting player**, not hardcoded player `0`.
* Keep golden replays runnable even when the starting player is not `0`.

---

## 3) Non-Goals

* No change to shuffle algorithm or pre-shuffle ordering.
* No UI changes.
* No change to the “seat index” model (player IDs remain `"0".."n-1"`).

---

## 4) Inputs

* Setup and game factory:
  * `packages/game/src/setup.ts`
  * `packages/game/src/index.ts`
* Starting influence assignment and handicap:
  * `packages/game/src/packs/core/index.ts`
* Golden replay harnesses (must not assume starting player is always `0`):
  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/integration-tests/scripts/update-golden.mjs`
* Example pattern for per-move player switching:
  * `packages/game/src/replay.ts` (`updatePlayerID(...)`)

---

## 5) Outputs

### 5.1 Code

* Persist starting seat index in state (engine attributes):
  * `packages/game/src/setup.ts`
* Use persisted value to drive the initial turn order (no RNG here):
  * `packages/game/src/index.ts` (add `turn.order.first`)
* Apply FirstPlayerHandicap using the persisted starting player (not `ctx.currentPlayer` during setup):
  * `packages/game/src/packs/core/index.ts`
* Make golden harness resilient to non-0 starting player (set client playerID to current player before each move):
  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/integration-tests/scripts/update-golden.mjs`

### 5.2 Tests

* Add/extend a setup-level test asserting:
  * starting player index is stored (0..n-1)
  * FirstPlayerHandicap applies to that player
  * no extra RNG calls are introduced beyond the canonical order
  * Suggested location: `packages/game/test/setup.test.ts` or a new focused test file.
* Update golden fixtures via script if hashes change.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (CORE setup/turn-order behavior becomes spec-aligned).
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Canonical RNG call order must remain:
  * shuffle consumes RNG
  * then exactly one “starting player” RNG call
* The “starting player” RNG call must be persisted and reused (no second call anywhere).
* Avoid schema drift: store the value in `G.engine.attributes` (already used for engine metadata).

---

## 7) Invariants (Must remain true)

* Identical seed + identical move sequence → identical hash.
* Golden replay runner continues to work for any starting player.

---

## 8) Implementation Plan

* [ ] Step 1: In `SetupGame`, replace the current “discarded” `random.Die(seatCount)` call with:
  * compute `k = random.Die(seatCount) - 1` (0-based)
  * persist to `G.engine.attributes.startingPlayerIndex = k`
* [ ] Step 2: In `createBalanceControlGame`, set `turn.order.first = (G) => G.engine.attributes.startingPlayerIndex ?? 0`.
* [ ] Step 3: In `CorePack.setup.postShuffle`, apply `firstPlayerHandicap` to `String(G.engine.attributes.startingPlayerIndex)` (fallback to `ctx.currentPlayer`).
* [ ] Step 4: Update golden replay harnesses to call `client.updatePlayerID(state.ctx.currentPlayer)` before invoking each move.
* [ ] Step 5: Regenerate golden hashes (script) and run full tests:
  * `pnpm -C packages/integration-tests run update:golden -- --write`
  * `pnpm test`

---

## 9) Acceptance Criteria

* [ ] Starting player is not hardcoded; it is derived from the canonical RNG call and persisted.
* [ ] Turn order begins at the persisted starting player.
* [ ] FirstPlayerHandicap reduces starting influence for the correct starting player.
* [ ] Golden replays run without assuming player `0` starts; fixtures updated via script.
* [ ] `/docs/changelog.md` references CORE-01-03-02A.2 and VAR-01-02-02/03.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately.
* [ ] Normative anchors cited.
* [ ] `pnpm test` passes.
* [ ] Golden replay gate passes.
* [ ] Working tree clean after postflight amend.
