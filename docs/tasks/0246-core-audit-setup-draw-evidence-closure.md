# Task 0246 — CORE Audit: Setup & Draw Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0246-core-audit-setup-draw-evidence-closure`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-003
* GR-011
### compliance_notes (required if affected_guardrails != NONE)
* GR-003: setup shuffle/call-order assertions must remain seed-deterministic.
* GR-011: settlement trigger sequencing must stay canonical.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-03-02, CORE-01-03-02A.1A, CORE-01-03-05, CORE-01-02-17E
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal
* Strengthen direct tests for setup initialization, canonical shuffle scope, and draw pipeline.
* Ensure setup-state obligations are evidenced by explicit assertions, not broad smoke checks.

## 3) Non-Goals
* No expansion setup work.
* No resolver modifications.

## 4) Inputs
* `docs/architecture/CORE-01-OBLIGATIONS.json`
* `packages/game/test/setup.test.ts`
* `packages/game/test/new-core-setup-obligations.test.ts`
* `packages/game/test/unplaceable-draw-redraw.test.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/setup.ts` (only if needed)
### 5.2 Tests
* `packages/game/test/setup.test.ts`
* `packages/game/test/new-core-setup-obligations.test.ts`
### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* Determinism and engine-authority constraints apply.

## 7) Invariants (Must remain true)
* Replay hash stability preserved.

## 8) Implementation Plan
* [ ] Map setup/draw IDs with weakly targeted evidence.
* [ ] Add targeted tests for each sampled obligation.
* [ ] Re-run audits and confirm closure.

## 9) Acceptance Criteria
* [ ] Setup/draw cluster IDs have direct, named executable assertions.
* [ ] `pnpm -w audit:core-obligations` reports no setup/draw SUSPECT items.
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
