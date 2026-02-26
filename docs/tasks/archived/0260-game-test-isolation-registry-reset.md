# Task 0260 — Game test isolation and registry reset hardening

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0260-game-test-isolation-registry-reset`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003:
  * Test updates enforce deterministic isolation and avoid order-dependent mutable harness leaks.
  * Endgame assertions now use deterministic turn finalization (`events.endTurn`) in tiny draw-pile scenarios.
* GR-012:
  * No changes to runtime config authority; pack registration/reset behavior remains test-only harness discipline.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-09-01A
* CORE: CORE-01-09-02
* CORE: CORE-01-09-03
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Ensure `moves.test.ts` and `turn.test.ts` are fully isolated and non-order-dependent.
* Eliminate leak paths around `EnginePackRegistry` in affected suites.
* Keep draw-pile immediate-end tests deterministic in both package and integration test harnesses.

## 3) Non-Goals

* No runtime rules-engine behavior change.
* No client-web feature or UI behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `packages/game/test/turn.test.ts`
  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/game/test/_helpers/registerPacks.ts`
* Existing behavior summary (current):
  * `moves.test.ts` had intra-test mutable state carry-over in a multi-move loop assertion.
  * Endgame test flow expected illegal post-settlement action with stale assumptions about turn finalization timing.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI engine/integration test scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`
* `packages/game/test/turn.test.ts`
* `packages/integration-tests/test/golden-replay.test.ts`

### 5.2 Tests

* Updated existing assertions in the files above.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism preserved.
* Engine authority unchanged.
* No phantom moves introduced.
* No implicit rule logic added.
* Expansion isolation unaffected.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* Zone invariants untouched.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: Inspect targeted suites and helper for shared mutable/singleton side effects.
* [x] Step 2: Add explicit isolation resets (harness and registry teardown) in affected game test suites.
* [x] Step 3: Align immediate-end draw-pile assertions with deterministic turn-finalization sequence in game + integration tests.
* [x] Step 4: Re-run `pnpm -C packages/game test` and `pnpm test`.
* [x] Step 5: Update changelog and record durable test strategy decision.

## 9) Acceptance Criteria

* [x] No order-dependent failure remains in updated suites.
* [x] Registry singleton cleanup is explicit in affected suites.
* [x] `pnpm -C packages/game test` passes.
* [x] `pnpm test` passes.

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Refactored game move-suite harness init into reusable `resetHarness` to isolate table-driven cases.
* Added explicit `EnginePackRegistry.clear()` teardown to `moves.test.ts` and `turn.test.ts`.
* Updated immediate-end draw-pile test flow to force deterministic turn finalization via `events.endTurn()`.
* Mirrored the same deterministic endgame flow in integration golden replay test.
* Documented the isolation strategy in changelog and DD-0260.

## 12) Commands Run (with outcomes)

* `pnpm build` → OK
* `pnpm lint` → OK
* `pnpm -C packages/game test` → OK
* `pnpm test` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

- 2026-02-25 (Codex): Added hard precondition in `registerTestPacks()` to fail fast if `core` registration does not yield non-empty `moves`; added explicit precondition assertion in `moves.test.ts` before resolver-driven `moveInfluence` path; audited `EnginePackRegistry.clear()` callsites and standardized additional registry suites to symmetric `beforeEach` + `afterEach` cleanup lifecycle.
