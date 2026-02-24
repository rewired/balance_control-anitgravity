# Task 0241 — Core Setup and Draw Flow Evidence Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0241-core-setup-draw-evidence-hardening`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-001
* GR-003

### compliance_notes (required if affected_guardrails != NONE)
* GR-001: State authority remains in engine; only stronger tests and evidence links.
* GR-003: Draw/shuffle checks must remain seeded and replayable.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-02-05, CORE-01-02-06, CORE-01-02-07, CORE-01-03-02A.1, CORE-01-03-03B, CORE-01-03-04
* ARCH: ARCH-01:DETERMINISM

## 2) Goal
* Close weak evidence around setup sequence, shuffling, and redraw behavior.
* Bind obligations to test names and assertion blocks instead of file-only references.

## 3) Non-Goals
* No expansion deck logic.
* No server persistence work.

## 4) Inputs
* packages/game/test/setup.test.ts
* packages/game/test/new-core-setup-obligations.test.ts
* packages/game/test/unplaceable-draw-redraw.test.ts

## 5) Outputs
### 5.1 Code
* packages/game/src/setup.ts (only if assertion gaps reveal bug)
### 5.2 Tests
* packages/game/test/setup.test.ts
* packages/game/test/new-core-setup-obligations.test.ts
### 5.3 Docs
* [x] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* No non-seeded randomness.
* Preserve core-only behavior.

## 7) Invariants (Must remain true)
* Fixed seed yields fixed drawpile order.
* Unplaceable tile redraw remains deterministic.

## 8) Implementation Plan
* [x] Map each listed rule ID to a dedicated assertion/test case.
* [x] Add explicit checks for turn-order seed effects.
* [x] Re-run audit and targeted setup tests.

## 9) Acceptance Criteria
* [x] All listed setup/draw IDs have executable assertion evidence.
* [x] `pnpm -C packages/game test -- setup.test.ts new-core-setup-obligations.test.ts unplaceable-draw-redraw.test.ts` passes. (executed via `pnpm -C packages/game exec vitest run test/setup.test.ts test/new-core-setup-obligations.test.ts test/unplaceable-draw-redraw.test.ts`)
* [x] `pnpm -w audit:core-obligations` shows no WEAK/SUSPECT for these IDs.

## 10) PR Checklist (Repo Artifact)
* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (blocked by pre-existing spec-anchor tripwire failures in task 0244 IDs)
* [x] Determinism verified (seeded setup/draw assertions)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* Added explicit setup evidence tests for CORE-01-03-03B and CORE-01-03-04, including ownership and starting-flag assertions on initial Influence allocation.
* Kept runtime logic unchanged; all changes are test/docs evidence hardening to preserve GR-001 state authority boundaries.
* Revalidated seeded setup determinism and canonical setup sequencing via focused setup obligations tests.
* Updated changelog with task(0241) evidence-hardening note.
* Re-ran core-obligation audit; WEAK/MISSING/SUSPECT remain zero.
* Captured full test-suite failure as pre-existing unrelated spec-anchor issue (task 0244 IDs).

## 12) Commands Run (with outcomes)
* `pnpm -C packages/rules build` → OK
* `pnpm -C packages/game exec vitest run test/setup.test.ts test/new-core-setup-obligations.test.ts test/unplaceable-draw-redraw.test.ts` → OK (21 passed)
* `pnpm -w audit:core-obligations` → OK (WEAK=0, SUSPECT=0)
* `pnpm lint` → OK
* `pnpm test` → FAIL (pre-existing `docs/tasks/0244...` unknown anchors in task 0244 (resolved later))

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
* N/A

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* N/A

## 15) Amendments (append-only)
* N/A
