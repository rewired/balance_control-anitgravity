# Task 0264 — FormalizeInfluence 5-player cap test uses cap-1 setup

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0264-formalize-influence-cap-minus-one`

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

* CORE: CORE-01-04-13

## 2) Goal

* Make `formalizeInfluence should allow up to cap for 5 players` derive setup and final assertion from `getInfluenceCap(ctx)`.
* Ensure the positive-path test prepares exactly `cap - 1` owned influence before formalization.

## 3) Non-Goals

* No runtime engine logic changes.
* No changes to the adjacent rejection-at-cap test.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test-only change, no client-web scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* Focused run for `formalizeInfluence` cap tests in `moves.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keep `ctx.numPlayers = 5` unchanged in the target test.
* Keep rejection test `formalizeInfluence should reject at cap for 5 players without mutation` unchanged.

## 7) Invariants (Must remain true)

* `formalizeInfluence` remains legal at `cap - 1` and reaches cap exactly.
* At exact cap, `formalizeInfluence` remains invalid and non-mutating (covered by unchanged adjacent test).

## 8) Implementation Plan

* [x] Step 1: Replace `seedPlayerInfluenceAtCap()` call with explicit `cap - 1` setup loop.
* [x] Step 2: Execute `CoreMoves.formalizeInfluence(...)` unchanged.
* [x] Step 3: Update final expectation from hardcoded `8` to computed `cap`.
* [x] Step 4: Run focused vitest assertions.
* [x] Step 5: Update changelog + task artifact.

## 9) Acceptance Criteria

* [x] Target test still sets `ctx.numPlayers = 5`.
* [x] Setup uses `const cap = getInfluenceCap(ctx)` and seeds only to `cap - 1`.
* [x] Test continues asserting `result !== INVALID_MOVE`.
* [x] Final owned influence assertion uses `expect(countOwnedInfluence()).toBe(cap)`.
* [x] Adjacent rejection-at-cap test is unchanged.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test-only assertion/setup refinement)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Reworked the 5-player positive-path `formalizeInfluence` test setup to seed owned influence only through `cap - 1`.
* Preserved `ctx.numPlayers = 5` and unchanged move invocation semantics.
* Replaced hardcoded cap assertion (`8`) with computed cap-based assertion for future-proofing.
* Left the adjacent rejection-at-cap test unchanged as explicit cap-boundary proof.
* Updated task/changelog artifacts for traceability.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts -t "formalizeInfluence should allow up to cap for 5 players|formalizeInfluence should reject at cap for 5 players without mutation"` → FAIL (workspace package export build artifacts missing in this container state)
* `pnpm build` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts -t "formalizeInfluence should allow up to cap for 5 players|formalizeInfluence should reject at cap for 5 players without mutation"` → OK

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
