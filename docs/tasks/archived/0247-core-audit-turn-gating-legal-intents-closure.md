# Task 0247 — CORE Audit: Turn Gating & Legal Intents Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0247-core-audit-turn-gating-legal-intents-closure`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-004
* GR-005
* GR-006
### compliance_notes (required if affected_guardrails != NONE)
* Legal move enumeration remains canonical.
* No new phantom actions.
* Pending-choice gating must remain strict.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-04-11A, CORE-01-04-22D, CORE-01-04-22E, CORE-01-08-08, CORE-01-08-08A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:LEGALITY_ENUMERATION

## 2) Goal
* Close evidence gaps where move legality relies on broad `moves.test.ts` coverage.
* Add targeted assertions for legality/failure/atomicity obligations in political actions.

## 3) Non-Goals
* No new move types.
* No UI controls changes.

## 4) Inputs
* `docs/architecture/CORE-01-OBLIGATIONS.json`
* `packages/game/test/moves.test.ts`
* `packages/game/test/legal-intents.test.ts`
* `packages/game/src/moves/stages/politicalAction.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/moves/stages/politicalAction.ts` (only if defects found)
### 5.2 Tests
* `packages/game/test/moves.test.ts`
* `packages/game/test/legal-intents.test.ts`
### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* Determinism and no-implicit-rule policy apply.

## 7) Invariants (Must remain true)
* Illegal payloads must fail atomically.

## 8) Implementation Plan
* [x] Build rule-to-test matrix for turn gating/legality IDs.
* [x] Add missing direct tests with explicit rule-ID mapping.
* [x] Re-run audits and ensure no legal-intents SUSPECT entries remain.

## 9) Acceptance Criteria
* [x] Each listed CORE legality ID has a direct executable assertion.
* [x] `pnpm -w audit:core-obligations` shows no WEAK/SUSPECT for turn/legality cluster.
* [x] Golden replay unchanged or intentionally updated with explanation.

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

## 11) Work Summary (3–7 bullets)
* Verified the turn-gating legality cluster already has direct executable assertions in targeted suites (`moves.test.ts` and `legal-intents.test.ts`) for CORE-01-04-11A, CORE-01-04-22D/E, and CORE-01-08-08/08A.
* Re-ran the obligations audit and confirmed zero WEAK/MISSING/SUSPECT entries, including the turn/legality cluster.
* Built workspace packages to restore workspace export resolution before running targeted turn-gating suites, then ran full repository quality gates (`lint`, `test`) to preserve deterministic evidence closure.
* Updated changelog and task execution artifact sections for closure-mode completion (no runtime logic changes required).
## 12) Commands Run (with outcomes)
* `pnpm -w audit:core-obligations` ✅ PASS (WEAK: 0, SUSPECT: 0).
* `pnpm vitest run packages/game/test/moves.test.ts packages/game/test/legal-intents.test.ts` ⚠️ INITIAL FAIL (`@balance-control/rules` export resolution before build).
* `pnpm -r build` ✅ PASS.
* `pnpm vitest run packages/game/test/moves.test.ts packages/game/test/legal-intents.test.ts` ✅ PASS.
* `pnpm lint` ✅ PASS.
* `pnpm test` ✅ PASS.
## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
Recorded in final commit message (Postflight: block).
## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
Recorded in final commit message (Postflight: block).
## 15) Amendments (append-only)
* 2026-02-24: Executed in closure mode by validating the turn-gating legality evidence cluster, re-running audits/tests, and updating Sections 8–12 plus changelog bookkeeping.
