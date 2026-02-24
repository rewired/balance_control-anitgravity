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
* [ ] Build rule-to-test matrix for turn gating/legality IDs.
* [ ] Add missing direct tests with explicit rule-ID mapping.
* [ ] Re-run audits and ensure no legal-intents SUSPECT entries remain.

## 9) Acceptance Criteria
* [ ] Each listed CORE legality ID has a direct executable assertion.
* [ ] `pnpm -w audit:core-obligations` shows no WEAK/SUSPECT for turn/legality cluster.
* [ ] Golden replay unchanged or intentionally updated with explanation.

## 10) PR Checklist (Repo Artifact)
* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* N/A
## 12) Commands Run (with outcomes)
* N/A
## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
Recorded in final commit message (Postflight: block).
## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
Recorded in final commit message (Postflight: block).
## 15) Amendments (append-only)
* N/A
