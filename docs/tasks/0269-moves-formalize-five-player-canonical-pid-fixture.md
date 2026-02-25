# Task 0269 — Moves formalize 5-player fixture canonical player IDs

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

* CORE: CORE-01-08-01
* CORE: CORE-01-08-02
* CORE: CORE-01-08-03

## 2) Goal

* Normalize `moves.test.ts` fixture player identity to canonical numeric string IDs.
* Ensure the 5-player `formalizeInfluence` fixture explicitly satisfies the all-starting-influence-placed precondition.
* Confirm the 5-player formalize cap boundary tests pass without engine semantic changes.

## 3) Non-Goals

* No changes to `formalizeInfluence` runtime legality semantics.
* No changes to resolver or move execution logic.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine test fixture-only scope)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* Targeted and full-file `moves.test.ts` runs.

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Fixture/setup-only fix; no rules-logic edits.
* Keep formalize cap semantics unchanged.

## 7) Invariants (Must remain true)

* `formalizeInfluence` remains legal at `cap - 1` and illegal at `cap`.
* 5-player tests remain derived from `getInfluenceCap(ctx)`.
* No new player-ID format divergence in this test fixture.

## 8) Implementation Plan

* [x] Step 1: Normalize fixture canonical player ID to `'0'` for context and owned objects.
* [x] Step 2: Keep personal supply zone key canonicalized as `PersonalSupply:<pid>`.
* [x] Step 3: Add fixture helper to ensure all players (0..n-1) have explicit PersonalSupply zones for all-starting-influence checks.
* [x] Step 4: Wire helper into both 5-player `formalizeInfluence` cap tests.
* [x] Step 5: Run focused and full-file test commands for `packages/game/test/moves.test.ts`.

## 9) Acceptance Criteria

* [x] `ctx.currentPlayer` and `ctx.activePlayers` use canonical numeric player IDs.
* [x] 5-player formalize fixture explicitly satisfies all-starting-influence-placed precondition.
* [x] Target failing case passes in a focused run.
* [x] Full `packages/game/test/moves.test.ts` run passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (N/A: fixture-only request; focused test execution requested)
* [x] `pnpm vitest run` (focused) passes
* [ ] Determinism verified (golden replay/state hash) (N/A: test fixture-only scope)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Canonicalized the move test harness around player ID `'0'` for ctx and object ownership.
* Added `personalSupplyZoneId(pid)` helper to keep zone key formatting canonical.
* Added `ensureAllStartingInfluencePlaced(numPlayers)` to materialize per-player supply zones and deterministic 5-player context.
* Updated both 5-player formalize cap tests to call explicit all-starting-influence fixture setup.
* Revalidated the target failing case and full `moves.test.ts` suite without touching formalize semantics.
* Added changelog entry documenting fixture normalization and precondition hardening.

## 12) Commands Run (with outcomes)

* `pnpm vitest run packages/game/test/moves.test.ts` → FAIL (missing built workspace package exports)
* `pnpm build` → OK
* `pnpm vitest run packages/game/test/moves.test.ts -t "formalizeInfluence should allow up to cap for 5 players|formalizeInfluence should reject at cap for 5 players without mutation"` → OK
* `pnpm vitest run packages/game/test/moves.test.ts` → OK

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
