# Task 0337 — setup seed propagation test path coverage

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003

### compliance_notes

* GR-003: Test coverage validates deterministic seed propagation precedence for setup by asserting direct `ctx.randomSeed` persistence.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule.
* [x] Class presence/absence: SEC present, DD present, TDD present, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Add rule doc comment and test-path coverage for direct `ctx.randomSeed` seed propagation.

## 3) Non-Goals

* No setup runtime behavior changes.
* No replay sink or server behavior changes.

## 4) Inputs

* `packages/game/test/setup.test.ts`

## 5) Outputs

### 5.1 Code

* `packages/game/test/setup.test.ts`

### 5.2 Docs

* `docs/tasks/0337-setup-seed-propagation-test-path.md`
* `/docs/changelog.md` updated.

## 6) Constraints (Hard)

* Preserve deterministic behavior assertions.
* Keep existing internal-seed coverage.

## 7) Invariants (Must remain true)

* Determinism contract remains intact.
* Existing setup test coverage remains green.

## 8) Implementation Plan

* [x] Add `@rule CORE-01-03-02A` above the target test.
* [x] Update the target test to use `ctx.randomSeed` and assert internal seed absence.
* [x] Keep internal random-internals seed test path coverage via existing test.

## 9) Acceptance Criteria

* [x] Target test includes rule doc comment.
* [x] Test uses `randomSeed: 'seed-x'` with no `_private.state.seed` and passes.
* [x] Existing internal-seed coverage remains present.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed and compliant.
* [x] Normative anchors cited.
* [x] `pnpm vitest run packages/game/test/setup.test.ts` passes.
* [x] No temporary files committed.
* [x] `/docs/changelog.md` updated.

## 11) Work Summary

* Added canonical `@rule CORE-01-03-02A` comment above the setup seed propagation test.
* Updated the target seed propagation test to cover direct `ctx.randomSeed` path with explicit no-internal-seed assertion.
* Kept internal RNG-internals seed path coverage through existing precedence test.
* Recorded task artifact and changelog note.

## 12) Commands Run (with outcomes)

* `pnpm vitest run packages/game/test/setup.test.ts` → OK

## 13) Postflight Proof (recorded in commit message)

Captured in final commit message `Postflight:` block.

## 14) Commit Proof (recorded in commit message)

Captured in final commit message `Postflight:` block with `git show -1 --stat`.

## 15) Amendments (append-only)

* N/A
