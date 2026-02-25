# Task 0268 — Harden moveInfluence ReturnPenalty test failure attribution

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

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

* Make the ReturnPenalty `moveInfluence` tests fail fast on illegal move return values before marker-position assertions.
* Make stage preconditions explicit in the affected tests to improve failure attribution.

## 3) Non-Goals

* No runtime game logic changes.
* No resolver/engine behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test-only scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* Hardened assertions in `moveInfluence` ReturnPenalty-related tests.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required by local documentation policy)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keep existing behavior coverage intact.
* Only adjust test structure/assertion order.

## 7) Invariants (Must remain true)

* ReturnPenalty test still validates `meta_p1` relocation and mode.
* Tests remain deterministic and isolated via existing suite setup/teardown.

## 8) Implementation Plan

* [x] Step 1: Capture `CoreMoves.moveInfluence(...)` return value in the destination-meta-marker ReturnPenalty test.
* [x] Step 2: Add `expect(result).not.toBe(INVALID_MOVE)` before marker relocation assertions.
* [x] Step 3: Add explicit stage precondition assertion(s).
* [x] Step 4: Apply same structure to adjacent similar `moveInfluence` ReturnPenalty test.
* [x] Step 5: Run focused test command and record outcome.

## 9) Acceptance Criteria

* [x] Targeted test stores move result before assertions.
* [x] Targeted test asserts non-`INVALID_MOVE` before marker-location checks.
* [x] Stage precondition assertion present.
* [x] Similar ReturnPenalty test uses same fail-fast structure.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (N/A for this focused test-hardening task)
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test-only hardening)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Stored `moveInfluence` return value in ReturnPenalty destination-marker test.
* Added explicit stage precondition assertion before move execution.
* Added fail-fast `result !== INVALID_MOVE` assertion before marker relocation checks.
* Applied same stage/result pattern to the adjacent ResortTile ReturnPenalty test.
* Updated changelog and task artifact.

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "moveInfluence should set ReturnPenalty mode"` → FAIL (workspace package `@balance-control/rules` entry unresolved before local build)
* `pnpm --filter @balance-control/rules build` → OK
* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "moveInfluence should set ReturnPenalty mode"` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Pending final commit.

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Pending final commit.

## 15) Amendments (append-only)

N/A
