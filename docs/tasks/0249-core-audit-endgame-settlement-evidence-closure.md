# Task 0249 — CORE Audit: Settlement & Endgame Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0249-core-audit-endgame-settlement-evidence-closure`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-011
* GR-003
### compliance_notes (required if affected_guardrails != NONE)
* Settlement sequencing stays canonical.
* Endgame trigger remains deterministic and replay-stable.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-07-03, CORE-01-07-03D, CORE-01-09-01A, CORE-01-09-02
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal
* Add explicit executable proof for final-settlement trigger and immediate game-end behavior.
* Strengthen evidence linking between turn progression and settlement/end checks.

## 3) Non-Goals
* No scoring model changes.
* No expansion endgame interactions.

## 4) Inputs
* `docs/architecture/CORE-01-OBLIGATIONS.json`
* `packages/game/test/turn.test.ts`
* `packages/integration-tests/test/golden-replay.test.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/index.ts` (only if defect found)
### 5.2 Tests
* `packages/game/test/turn.test.ts`
* `packages/integration-tests/test/golden-replay.test.ts`
### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* No implicit alternate end conditions.

## 7) Invariants (Must remain true)
* Same action list and seed produce same final hash.

## 8) Implementation Plan
* [ ] Isolate settlement/endgame obligations that currently rely on incidental assertions.
* [ ] Add direct tests asserting final settlement trigger and immediate end.
* [ ] Re-run audits and golden replay verification.

## 9) Acceptance Criteria
* [ ] Settlement/endgame IDs have direct executable evidence.
* [ ] `pnpm -w audit:core-obligations` shows no WEAK/SUSPECT in this cluster.
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
