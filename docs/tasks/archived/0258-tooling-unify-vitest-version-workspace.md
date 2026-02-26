# Task 0258 — Tooling: unify Vitest version across workspace

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0258-vitest-version-alignment`

---

**Task State:** FROZEN

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

* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Change is dependency/tooling-only (`vitest`/coverage runner version alignment) and keeps rule execution in engine packages.
  * `packages/client-web` test config keeps using built-in `coverage.provider: 'v8'` (no custom provider module path).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (no game-rule behavior change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-06-UI-INTERACTION-CONTRACT

---

## 2) Goal

* Remove mixed Vitest runner versions across workspace packages to avoid incompatible binary resolution.
* Keep UI coverage running with the `v8` provider and default provider loading semantics.
* Verify requested UI unit and coverage commands after dependency alignment.

## 3) Non-Goals

* No gameplay/rules/resolver/state-shape changes.
* No UI visual or interaction changes.
* No expansion enablement/state isolation logic changes.

## 4) Inputs

* Repo areas:
  * `package.json`
  * `packages/client-web/package.json`
  * `packages/client-web/vite.config.ts`
  * other workspace `package.json` files containing `vitest`
* Existing behavior summary (current):
  * Root and some packages pin `vitest` to `^0.30.x`, while `packages/client-web` uses `^0.34.6` and `@vitest/coverage-v8` `^0.34.6`, allowing mixed runner versions.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* Bound to `docs/testing/frontend-qa.md`.

---

## 5) Outputs

### 5.1 Code

* `package.json`
* `packages/game/package.json`
* `packages/packs/package.json`
* `packages/integration-tests/package.json`
* `pnpm-lock.yaml`

### 5.2 Tests

* N/A (dependency alignment only; no test source changes)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0258-vitest-workspace-version-alignment.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism unchanged; no new randomness.
* Engine authority unchanged.
* No implicit rules or phantom moves introduced.

---

## 7) Invariants (Must remain true)

* UI remains presentation-only.
* Engine behavior and legality remain unchanged.
* Coverage provider in Vite config remains `v8` with no custom provider module path.

---

## 8) Implementation Plan

* [x] Audit all workspace `package.json` files for `vitest` and coverage provider package versions.
* [x] Align `vitest` dependency versions across root + packages to one compatible target (`^0.34.6`).
* [x] Verify `packages/client-web/vite.config.ts` coverage provider configuration remains built-in `v8`.
* [x] Run frontend QA command order and requested UI verification commands.
* [x] Update changelog and add DD note for tooling decision traceability.

---

## 9) Acceptance Criteria

* [x] Workspace does not contain mixed `vitest` version ranges across root/package manifests.
* [x] `packages/client-web/vite.config.ts` keeps `test.coverage.provider: 'v8'` and no custom provider path setting.
* [x] `pnpm run test:ui:unit` passes.
* [x] `pnpm run test:ui:coverage` passes.

---

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Aligned workspace Vitest versions to a single compatible range to avoid runner mismatch.
* Kept UI coverage package on matching `@vitest/coverage-v8` version.
* Revalidated client-web coverage config for built-in `v8` provider usage.
* Updated changelog + DD artifact for tooling decision traceability.

---

## 12) Commands Run (with outcomes)

* `pnpm install` → ✅ PASS
* `pnpm lint` → ✅ PASS
* `pnpm run test:ui:unit` → ✅ PASS (41 files, 217 tests)
* `pnpm run test:ui:coverage` → ✅ PASS (41 files, 217 tests; coverage thresholds met)
* `pnpm run test:ui:e2e` → ⚠️ WARN (Playwright browser executable missing in container cache; `pnpm exec playwright install` required)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → ✅ PASS
* `pnpm run test:ui:unit` → ✅ PASS (41 files, 217 tests)
* `pnpm run test:ui:coverage` → ✅ PASS (41 files, 217 tests; coverage thresholds met)
* `pnpm run test:ui:e2e` → ⚠️ WARN (Playwright browser executable missing in container cache; `pnpm exec playwright install` required)

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only)

N/A
