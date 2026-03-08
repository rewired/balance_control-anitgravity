# Task 0338 — setup wrapped ctx seed preservation regression

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

* GR-003: Setup seed resolution now reads canonical seed candidates from the original boardgame.io wrapper context so deterministic replay seed persistence cannot be lost during context normalization.

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

* Preserve wrapper-provided seed fields (`randomSeed`, `_randomSeed`) when setup normalizes wrapped boardgame.io contexts.

## 3) Non-Goals

* No replay sink logic changes.
* No UI/client-web changes.

## 4) Inputs

* `packages/game/src/setup.ts`
* `packages/game/test/setup.test.ts`

## 5) Outputs

### 5.1 Code

* `packages/game/src/setup.ts`
* `packages/game/test/setup.test.ts`

### 5.2 Docs

* `docs/tasks/0338-setup-wrapped-ctx-seed-preservation.md`
* `/docs/changelog.md` updated.

## 6) Constraints (Hard)

* Keep setup RNG operations on normalized context.
* Seed persistence must remain deterministic and serializable.

## 7) Invariants (Must remain true)

* `G.engine.attributes.seed` remains canonical setup seed storage.
* Setup shuffle and Die calls still use normalized ctx random API.

## 8) Implementation Plan

* [x] Resolve setup seed from original `ctx` before flattening side-effects can drop wrapper fields.
* [x] Add regression test for wrapped context with outer `randomSeed` and inner ctx random internals.
* [x] Update changelog and task artifact.

## 9) Acceptance Criteria

* [x] Wrapped context with outer `randomSeed` persists that value into `G.engine.attributes.seed`.
* [x] Setup seed regression test fails before fix and passes after fix.
* [x] Targeted setup test suite passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed and compliant.
* [x] Normative anchors cited.
* [x] `pnpm vitest run packages/game/test/setup.test.ts` passes.
* [x] No temporary files committed.
* [x] `/docs/changelog.md` updated.

## 11) Work Summary

* Changed setup seed resolution call site to use original boardgame.io context wrapper.
* Added wrapped-context regression test asserting outer `randomSeed` wins over internal RNG seed fallback.
* Recorded task artifact and changelog entry.

## 12) Commands Run (with outcomes)

* `pnpm vitest run packages/game/test/setup.test.ts` → OK

## 13) Postflight Proof (recorded in commit message)

Captured in final commit message `Postflight:` block.

## 14) Commit Proof (recorded in commit message)

Captured in final commit message `Postflight:` block with `git show -1 --stat`.

## 15) Amendments (append-only)

* N/A
