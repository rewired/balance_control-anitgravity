# Task 0262 — Derive moveInfluence cap-relocation assertions from snapshot baseline

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0261-influence-move-atom-proof`

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

* CORE: CORE-01-04-12
* CORE: CORE-01-08-01

## 2) Goal

* Remove hardcoded cap assumptions in `moveInfluence should remain legal at cap because it only relocates markers`.
* Make the pre/post expectations derive from a captured initial snapshot.
* Keep resolver/history assertions unchanged.

## 3) Non-Goals

* No runtime rule/engine behavior changes.
* No move legality algorithm changes.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test-only change, no client-web scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* `packages/game/test/moves.test.ts` (updated assertion logic)

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Preserve deterministic test behavior.
* Preserve queue/history atom assertions exactly.

## 7) Invariants (Must remain true)

* `moveInfluence` relocation keeps owned influence count constant.
* Resolver history includes `influence.move` and effect queue remains empty after resolve.

## 8) Implementation Plan

* [x] Step 1: Remove hardcoded `sourceBefore === 6` precondition.
* [x] Step 2: Assert post-move deltas from captured `sourceBefore/targetBefore/beforeCount`.
* [x] Step 3: Seed/assert cap via `getInfluenceCap(ctx)` to keep explicit “at cap” semantics.
* [x] Step 4: Run focused test suite.
* [x] Step 5: Update changelog + task artifact.

## 9) Acceptance Criteria

* [x] No hardcoded source/target absolute post values remain in the cap-relocation test.
* [x] Test checks `sourceInfluence === sourceBefore - 1`, `targetInfluence === targetBefore + 1`, and stable owned count.
* [x] Existing assertions for `atom: 'influence.move'` and queue empty remain unchanged.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test-only assertion refactor)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Imported and used `getInfluenceCap(ctx)` in `moves.test.ts` to derive cap-aware setup.
* Replaced hardcoded preconditions with snapshot-derived delta assertions for source/target influence counts.
* Kept resolver-history/queue assertions unchanged as requested.
* Added changelog and task artifact trace for this test-proof refinement.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `pnpm build` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts` → FAIL (pre-existing unrelated failure in `formalizeInfluence should allow up to cap for 5 players`)
* `cd packages/game && pnpm vitest run test/moves.test.ts -t "moveInfluence should remain legal at cap because it only relocates markers"` → OK

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
