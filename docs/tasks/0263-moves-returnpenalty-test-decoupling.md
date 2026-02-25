# Task 0263 — Decouple moveInfluence ReturnPenalty assertion from pack-registry preconditions

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0263-moves-returnpenalty-test-decoupling`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-12A
* CORE: CORE-01-04-12B
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Remove registry-coupled precondition assertions from the `moveInfluence` ReturnPenalty move-semantic test.
* Keep the ReturnPenalty test focused on business outcome (`meta_p1` relocation + mode).
* Preserve per-test harness reset behavior for move tests.
* Add one dedicated registry-invariant test close to the register helper.

## 3) Non-Goals

* No runtime engine or rules logic change.
* No change to production/resolver order.
* No move legality semantics change outside targeted test assertions.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `packages/game/test/_helpers/registerPacks.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test-only scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`
* `packages/game/test/_helpers/registerPacks.test.ts`

### 5.2 Tests

* Focused move-semantic test update in `moves.test.ts`
* Added helper-level registry invariant test in `_helpers/registerPacks.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keep move tests isolated through reset hooks.
* Keep registry assertions out of move semantics tests.
* Ensure deterministic, side-effect-contained tests.

## 7) Invariants (Must remain true)

* `beforeEach(resetHarness)` remains for move tests.
* ReturnPenalty semantics test asserts marker relocation + mode only.
* Registry core-pack invariant is tested independently.

## 8) Implementation Plan

* [x] Step 1: Remove in-test registry precondition helper/usage from `moves.test.ts`.
* [x] Step 2: Preserve and simplify move harness lifecycle with `beforeEach(resetHarness)`.
* [x] Step 3: Add helper-near dedicated registry invariant test for `registerTestPacks`.
* [x] Step 4: Run focused vitest checks.
* [x] Step 5: Update task + changelog artifacts.

## 9) Acceptance Criteria

* [x] `expectCorePackRegistered()` no longer appears in the ReturnPenalty move test.
* [x] ReturnPenalty test verifies `meta_p1` on `board_t1`, not on `board_t2`, and mode `ReturnPenalty`.
* [x] Registry behavior is validated in a separate dedicated test file near `_helpers/registerPacks.ts`.
* [x] Move-test harness reset remains via `beforeEach(resetHarness)`.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test-only decoupling)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Removed `expectCorePackRegistered()` helper and invocation from the ReturnPenalty move test.
* Kept ReturnPenalty assertions strictly on marker location and mode result.
* Preserved move suite isolation with direct `beforeEach(resetHarness)`.
* Added `_helpers/registerPacks.test.ts` to verify core-pack registry invariant separately.
* Updated changelog and task artifact for traceability.

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "moveInfluence should set ReturnPenalty mode when meta-marker starts on destination"` → FAIL (workspace package `@balance-control/rules` entry unresolved before local build)
* `pnpm --filter @balance-control/rules build` → OK
* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "moveInfluence should set ReturnPenalty mode when meta-marker starts on destination"` → OK
* `pnpm --filter @balance-control/game exec vitest run test/_helpers/registerPacks.test.ts` → OK
* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts test/_helpers/registerPacks.test.ts` → FAIL (pre-existing unrelated failure: `formalizeInfluence should allow up to cap for 5 players`)

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

N/A
