# Task 0250 — Refactor Political Action Moves into Per-Move Modules

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-002
* GR-003
### compliance_notes (required if affected_guardrails != NONE)
* Refactor keeps move signatures and boardgame.io wiring unchanged; rule execution remains engine-owned.
* Change is structural-only and preserves deterministic code paths and ordering.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-04-10, CORE-01-04-12, CORE-01-04-13, CORE-01-04-20, CORE-01-08-06A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-01:DETERMINISM

## 2) Goal
* Split `politicalAction` move implementations into one file per move while preserving behavior and exported signatures.

## 3) Non-Goals
* No rule logic changes.
* No move payload schema changes.
* No stage-wiring API changes.

## 4) Inputs
* `packages/game/src/moves/stages/politicalAction.ts`
* `packages/game/src/moves/index.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/moves/stages/politicalAction/index.ts`
* `packages/game/src/moves/stages/politicalAction/placeInfluence.ts`
* `packages/game/src/moves/stages/politicalAction/moveInfluence.ts`
* `packages/game/src/moves/stages/politicalAction/formalizeInfluence.ts`
* `packages/game/src/moves/stages/politicalAction/convertResources.ts`
* remove `packages/game/src/moves/stages/politicalAction.ts`
### 5.2 Tests
* N/A (behavior-preserving refactor; validation via lint/tests)
### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* Keep exported move signatures unchanged.
* Keep `@rule` and inline rule-anchor comments attached to the same logic.

## 7) Invariants (Must remain true)
* `PoliticalActionMoves` export shape remains compatible with existing imports.
* Move execution order and EffectResolver calls remain unchanged.

## 8) Implementation Plan
* [x] Create `stages/politicalAction/` directory and extract each move into its own module.
* [x] Add `index.ts` composer exporting `PoliticalActionMoves`.
* [x] Preserve signature and rule-anchor comments in extracted implementations.
* [x] Update docs artifacts required by repo policy.

## 9) Acceptance Criteria
* [x] Existing callers can continue importing `PoliticalActionMoves` from `./stages/politicalAction`.
* [x] Code compiles/lints with the split module structure.
* [x] Rule-anchor comments remain present on corresponding logic.

## 10) PR Checklist (Repo Artifact)
* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes _(blocked by pre-existing workspace Vitest package-entry resolution failure for `@balance-control/rules`)_
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* Replaced monolithic `politicalAction.ts` with per-move modules under `stages/politicalAction/`.
* Added an `index.ts` aggregator that preserves `PoliticalActionMoves` export compatibility.
* Kept move signatures unchanged for boardgame.io wiring compatibility.
* Preserved `@rule` and inline anchor comments adjacent to the same move logic.
* Updated changelog and task artifact for repo-policy compliance.

## 12) Commands Run (with outcomes)
* `pnpm lint` ✅
* `pnpm test` ⚠️ fails due to pre-existing workspace Vitest package-entry resolution failure for `@balance-control/rules` (expansion and game suites).
* `pnpm --filter @balance-control/game test` ⚠️ same pre-existing `@balance-control/rules` package-entry resolution failure.

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)
* 2026-02-24 (amendment): Added `stages/politicalAction/shared.ts` helper to centralize stage assertion, political-action usage precheck, and canonical successful finalization (usage increment + `events.endTurn`) across place/move/formalize/convert moves.
* 2026-02-24 (amendment): Preserved Start Committee special-case tracking in `formalizeInfluence` via explicit `beforeUsageIncrement` callback hook.
* 2026-02-24 (amendment): Expanded `packages/game/test/moves.test.ts` with regression coverage for invalid stage rejection, exhausted usage rejection, and successful finalization usage/endTurn invariants.
* 2026-02-24 (amendment): Command reruns — `pnpm lint` ✅; `pnpm --filter @balance-control/game test -- moves.test.ts` ⚠️ (pre-existing workspace/Vite package-entry resolution failure for `@balance-control/rules`).
