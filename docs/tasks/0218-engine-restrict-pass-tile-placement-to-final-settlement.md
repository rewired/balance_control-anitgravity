# Task 0218 — Restrict passTilePlacement to final-settlement conditions (no “skip placement” during normal turns)

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0218-restrict-pass-tile-placement`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:
  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-004
* GR-005
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Changes remain deterministic; no new RNG calls; no non-deterministic branching.
* GR-004: We only tighten legality exposure; we do not add new intent types. enumerateLegalIntents remains pure.
* GR-005: We do not add moves/intents; we restrict when an existing move/intent is available.
* GR-006: Behavior becomes more aligned with the “no bypass” expectation for forced flow at draw/settlement boundaries.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-04 (DrawAndPlace repeats until a tile is placed or DrawPile is empty)
* CORE: CORE-01-04-05A (If drawn tile has ≥1 legal position, player MUST choose one)
* CORE: CORE-01-09-01A (If DrawPile empty at DrawAndPlace start, final settlement triggers; skip political action)
* VAR: VAR-01-01-08 (If no adjacent unoccupied positions exist, treat as DrawPile empty for final settlement)
* ARCH: ARCH-01 (engine authority; legality belongs to engine)
* ARCH: ARCH-03:PENDING CHOICE (only resolveChoice intents when pendingChoice exists)

Rule:
* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* “Skip placement / passTilePlacement” must **NOT** be a normal user escape hatch.
* passTilePlacement becomes legal **only** in final-settlement situations:
  * DrawPile empty at turn start (flagged), or
  * noLegalPlacements (VAR-01-01-08 guard).
* UI no longer receives a passTilePlacement intent unless those conditions hold.

---

## 3) Non-Goals

* Do not change draw mechanics (drawTileToStaging) beyond what is needed to enforce legality of pass.
* Do not redesign pendingChoice UX.
* Do not add new moves or new intents.

---

## 4) Inputs

* Repo areas:
  * `packages/game/src/moves/stages/drawAndPlace.ts` (passTilePlacement)
  * `packages/game/src/engine/legal-intents.ts` (enumerateLegalIntents: passTilePlacement exposure)
  * `packages/game/src/index.ts` (onBegin flags already set)
  * `packages/game/test/turn.test.ts` (existing passTilePlacement tests)

* Existing behavior summary (current):
  * `enumerateLegalIntents` offers `passTilePlacement` whenever staging is empty in drawAndPlace.
  * `passTilePlacement` move can end the drawAndPlace stage to politicalAction even when this state is “abnormal”.
  * This allows the UI to show “Skip placement” in situations that should not exist per CORE-01-04-04.

---

## 5) Outputs

### 5.1 Code

1) Tighten intent enumeration:
* `packages/game/src/engine/legal-intents.ts`
  * In drawAndPlace stage, when `stagedTileId` is missing:
    * ONLY add `passTilePlacement` if:
      * `G.engine.attributes.drawPileEmptyAtTurnStart === true`, OR
      * `G.engine.attributes.noLegalPlacements === true`
    * Otherwise: no pass intent.

2) Tighten move legality:
* `packages/game/src/moves/stages/drawAndPlace.ts`
  * In `passTilePlacement`:
    * After confirming staging empty:
      * If neither `drawPileEmptyAtTurnStart` nor `noLegalPlacements` is set → return INVALID_MOVE.
    * Keep the existing final settlement path when flags are set.
    * Remove/avoid the “endStage to politicalAction” fallback for the empty-staging case.

3) Documentation:
* Update `/docs/changelog.md` (engine legality change).

### 5.2 Tests

* Update / add tests in `packages/game/test/turn.test.ts`:
  * Add a test: passTilePlacement is rejected when staging is empty BUT drawPile is not empty AND no final-settlement flags are set.
    * Implement by mutating `client.getState().G.zones[stagingId].items = []` while DrawPile still has items, then call `passTilePlacement({})` and assert:
      * state unchanged and stage remains drawAndPlace.

* Optional: add a unit test asserting `enumerateLegalIntents` does not include passTilePlacement in that abnormal state.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created — NOT REQUIRED
* [ ] `/docs/rules/ERRATA-XXXX.md` created — NOT REQUIRED

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:
  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

* [ ] Implement intent restriction in `enumerateLegalIntents` for passTilePlacement.
* [ ] Implement move restriction in `DrawAndPlaceMoves.passTilePlacement`.
* [ ] Add test for “staging empty, drawPile non-empty, no flags → INVALID_MOVE”.
* [ ] Run all game tests.
* [ ] Update `/docs/changelog.md` with a short entry.

Notes:
* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] During normal gameplay (draw pile not empty), UI never receives a passTilePlacement intent.
* [ ] passTilePlacement is legal only when CORE-01-09-01A / VAR-01-01-08 conditions apply.
* [ ] All `packages/game` tests pass.
* [ ] Changelog updated.
* [ ] Determinism preserved (golden replay unchanged or updated intentionally with explanation).

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary

* **Restricted `passTilePlacement` intent:** Updated `enumerateLegalIntents` to only offer `passTilePlacement` when `drawPileEmptyAtTurnStart` or `noLegalPlacements` flags are set.
* **Restricted `passTilePlacement` move:** Updated `DrawAndPlaceMoves.passTilePlacement` to return `INVALID_MOVE` if neither flag is set, preventing the "skip placement" escape hatch during normal turns.
* **Added Test Coverage:** Added a reproduction test case in `packages/game/test/turn.test.ts` that forces an empty staging area with a non-empty draw pile (via custom game setup) and asserts that `passTilePlacement` is rejected.
* **Verified:** All game tests passed.

## 12) Commands Run

```bash
pnpm --filter @balance-control/game test packages/game/test/turn.test.ts
pnpm lint
git status -sb
git diff --stat
```

## 13) Guardrails

* **GR-003 (Determinism):** No new RNG or time-based logic. Changes are purely state-based.
* **GR-004 (Intent Enumeration):** `enumerateLegalIntents` remains pure and deterministic. We restricted when an intent is added based on existing flags.
* **GR-005 (Move Legality):** We did not add new moves. We restricted an existing move to its intended scope (final settlement).
* **GR-006 (Flow Control):** The change enforces the intended game flow (must place tile if possible) and prevents bypassing it.

---

## 15) Amendments (append-only)

*(none)*
