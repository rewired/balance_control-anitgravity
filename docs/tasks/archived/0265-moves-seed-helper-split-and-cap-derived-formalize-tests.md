# Task 0265 — Moves test seed helper split and cap-derived formalize setup

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0265-moves-seed-helper-split`

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

* CORE: CORE-01-04-09
* CORE: CORE-01-04-11
* CORE: CORE-01-04-12

## 2) Goal

* Split cap seeding into explicit helpers for relocation and count-targeted setup.
* Convert `formalizeInfluence` creation-path tests to `cap - 1`/`cap` setup through the new count helper.
* Remove hardcoded cap literals in 5-player tests.
* Add explicit rationale comments for cap legality distinction (relocation legal, creation illegal).

## 3) Non-Goals

* No runtime engine logic changes.
* No production/state schema changes.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test-only change, no client-web scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* Focused `moves.test.ts` run for cap-related move/formalize tests.

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keep semantics of existing tests unchanged.
* Keep cap derivation bound to `getInfluenceCap(ctx)`.

## 7) Invariants (Must remain true)

* Relocation moves remain legal at cap.
* Creation move `formalizeInfluence` remains illegal at cap and non-mutating.
* 5-player tests derive cap dynamically.

## 8) Implementation Plan

* [x] Step 1: Replace single cap helper with `seedPlayerInfluenceToCount` and `seedPlayerInfluenceToCap`.
* [x] Step 2: Migrate relocation tests to `seedPlayerInfluenceToCap`.
* [x] Step 3: Migrate creation tests to `seedPlayerInfluenceToCount(cap - 1)` or `seedPlayerInfluenceToCount(cap)`.
* [x] Step 4: Remove hardcoded cap literal (`8`) from 5-player formalize cap test.
* [x] Step 5: Add explanatory test comments for relocation-vs-creation cap legality timing.
* [x] Step 6: Run focused test command and record results.

## 9) Acceptance Criteria

* [x] Helper split is present with requested names.
* [x] `formalizeInfluence` creation tests use count helper with `cap - 1` / `cap`.
* [x] No hardcoded cap literal in 5-player tests.
* [x] Cap legality rationale comments are present in test code.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test-only setup refinement)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Split Influence seed setup into `seedPlayerInfluenceToCount(targetCount)` and `seedPlayerInfluenceToCap()` helpers.
* Updated relocation-at-cap tests (`moveInfluence`, `placeInfluence`) to call `seedPlayerInfluenceToCap()`.
* Updated creation-path `formalizeInfluence` tests to call count-based setup (`cap - 1` and `cap`).
* Removed the hardcoded `8` in the 5-player rejection test and used `getInfluenceCap(ctx)`.
* Added comments documenting why relocation remains legal at cap while creation is rejected at cap.
* Updated changelog with the new test-refactor entry.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts -t "moveInfluence should remain legal at cap because it only relocates markers|placeInfluence should remain legal at cap because it uses existing supply marker|formalizeInfluence should be rejected at cap without partial mutation|formalizeInfluence should allow up to cap for 5 players|formalizeInfluence should reject at cap for 5 players without mutation"` → FAIL (workspace package export build artifacts missing)
* `pnpm build` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts -t "moveInfluence should remain legal at cap because it only relocates markers|placeInfluence should remain legal at cap because it uses existing supply marker|formalizeInfluence should be rejected at cap without partial mutation|formalizeInfluence should allow up to cap for 5 players|formalizeInfluence should reject at cap for 5 players without mutation"` → OK

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
