# Codex Task 0101 - Pack Tooling + Test Matrix (Golden Replays + verify-packs)

**Date:** 2026-02-17
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

---

**Task State:** COMMIT_READY

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-001
* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Pack tooling and fixtures operate in packages/game without introducing non-serializable state.
* GR-003: Golden replays and surface hashes verify deterministic outputs.
* GR-012: Pack enablement uses canonical config selection and registry validation.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-01:STATE_AUTHORITY, ARCH-02:SERIALIZATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Expand golden replay coverage across core and expansion pack combinations.
* Add pack verification tooling to catch registry and surface drift.
* Keep CI validation deterministic and fast.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No rule logic changes or new moves.
* No UI changes or bot behavior changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* `packages/game/test/golden/*.json`
* `packages/game/test/golden-replay.test.ts`
* `packages/game/test/engine-pack-registry.test.ts`
* `packages/game/src/expansion-registry.ts`
* `scripts/verify-task.mjs`
* `package.json`

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `scripts/verify-packs.mjs`
* `package.json`
* `packages/game/src/expansion-registry.ts`
* `packages/game/src/setup.ts`

### 5.2 Tests

* `packages/game/test/golden/*.json`
* `packages/game/test/engine-pack-registry.test.ts`

### 5.3 Docs

* N/A

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Keep runtime fast; do not generate 100-match suites.
* Avoid snapshot noise; store stable, minimal fixtures.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* Pack assembly order remains canonical and deterministic.
* Pack manifests remain consistent with registry entries.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Add golden fixtures for core + expansions + combo.
* [x] Update registry tests to cover pack validation edge cases.
* [x] Implement verify-packs and wire it into repo scripts/CI.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `pnpm run verify:packs` passes and validates core + expansions.
* [x] Golden replay suite covers core-only and each single expansion.
* [x] CI audit includes pack tooling checks.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Golden replays added for core-only and each single expansion
* [x] Registry invariant tests added
* [x] `verify:packs` script implemented and wired into scripts/CI
* [x] All tests pass locally
* [ ] Meaningful commit message, e.g. `test: add pack matrix and verify-packs tooling`

---

## 11) Work Summary (3–7 bullets)

* Added verify-packs script to validate pack assembly order and surface hashes.
* Updated golden replay fixtures for exp01/exp02/exp03 and core+exp01+exp02.
* Corrected the hotspot convert pingpong fixture to avoid invalid move ordering.
* Extended registry tests to assert pinned version validation.
* Fixed type definitions to align setup/meta and pinned version handling.

---

## 12) Commands Run

* `pnpm -C packages/rules build`
  ```text
  > @balance-control/rules@0.0.1 build D:\__DEV\balance_control-anitgravity\packages\rules
  > tsc
  ```
* `pnpm -C packages/game build`
  ```text
  > @balance-control/game@0.0.1 build D:\__DEV\balance_control-anitgravity\packages\game
  > tsc
  ```
* `pnpm run verify:packs`
  ```text
  > balance-control-monorepo@0.0.0 verify:packs D:\__DEV\balance_control-anitgravity
  > node scripts/verify-packs.mjs

  [verify-packs] OK: Registered packs are in canonical order.
  [verify-packs] OK: Pack manifests present and consistent.
  [verify-packs] OK: Pack surface validated for core.
  [verify-packs] OK: Pack surface validated for ex01.
  [verify-packs] OK: Pack surface validated for ex02.
  [verify-packs] OK: Pack surface validated for ex03.
  [verify-packs] OK: Pack surface validated for ex01ex02.
  ```
* `pnpm lint`
  ```text
  > balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
  > eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"

  =============

  WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

  You may find that it works just fine, or you may not.

  SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

  YOUR TYPESCRIPT VERSION: 5.9.3

  Please only submit bug reports when using the officially supported version.

  =============
  ```
* `pnpm test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test

  Test Files  32 passed (32)
  Tests       131 passed (131)

  Test Files  16 passed (16)
  Tests       48 passed (48)
  ```

---

## 13) Guardrails

* GR-001, GR-003, GR-012

---

## 14) Postflight Proof

* N/A (no commit performed)

---

## 15) Amendments (append-only)

* 2026-02-17: Sections 0–9 were backfilled to match the current task template after implementation.
