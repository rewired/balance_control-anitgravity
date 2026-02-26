# Task 0259 — UI E2E Linux dependencies gate

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0259-ui-e2e-linux-deps-gate`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * This task only adjusts CI/runtime dependencies for Playwright execution and does not move legality/cost/rules into client code.
  * QA docs explicitly preserve hard-fail behavior for unit/coverage gates.
* GR-014:
  * No icon mapping or visual namespace contract changes; only test environment setup and QA documentation updates.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (no gameplay/rule behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT; ARCH-06 UI contract verification gates

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Identify and document the runtime environment used for `pnpm run test:ui:e2e`.
* Ensure Linux Playwright dependencies are installed in CI before E2E execution.
* Re-run E2E after dependency installation changes.
* Document fallback behavior: E2E can be WARN only for environment restrictions; unit/coverage remain hard-fail.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No gameplay/rules/engine behavior changes.
* No client-web feature or visual component modifications.
* No changes to expansion or bot logic.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `.github/workflows/ci.yml`
  * `docs/testing/frontend-qa.md`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * `ui_e2e` CI job currently runs on `windows-latest` and installs Playwright browser binaries only.
  * Linux shared-library dependency errors (`libatk-1.0.so.0`) were observed in prior runs.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `.github/workflows/ci.yml`

### 5.2 Tests

* N/A (existing E2E suite rerun only)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Step 1: Update CI `ui_e2e` environment/dependency install step to provision Playwright Linux deps before test execution.
* [x] Step 2: Document CI/dev-container dependency expectations and ENV-WARN fallback in frontend QA runbook.
* [x] Step 3: Re-run `pnpm run test:ui:e2e` and record result.
* [x] Step 4: Update changelog and complete task artifact sections.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] CI setup installs Playwright browser + Linux dependencies in the E2E job before running tests.
* [x] Runbook documents environment detection and WARN-vs-FAIL behavior for restrictive containers.
* [x] `pnpm run test:ui:e2e` has been re-executed and outcome recorded.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Identified `pnpm run test:ui:e2e` CI runtime in `.github/workflows/ci.yml` (`ui_e2e` job) and switched it from Windows to Linux (`ubuntu-latest`) for deterministic Playwright Linux dependency provisioning.
* Updated CI Playwright install step to `pnpm exec playwright install --with-deps chromium` so Chromium + Linux shared libraries are installed before E2E.
* Re-ran E2E locally before/after dependency install: missing browser executable issue resolved; remaining failures are functional test failures (not missing Linux libs).
* Updated `docs/testing/frontend-qa.md` with strict gate semantics: lint/unit/coverage hard-fail, E2E WARN only for verified environment restrictions.
* Added changelog entry for task(0259).

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm run test:ui:e2e` → ❌ FAIL (before dependency install): Playwright Chromium headless shell executable missing.
* `pnpm exec playwright install --with-deps chromium` → ✅ PASS (installed Chromium browser binaries and Linux shared dependencies, including `libatk-1.0-0` equivalent package on Ubuntu noble).
* `pnpm run test:ui:e2e` → ❌ FAIL (after dependency install): 5 tests fail for functional/flow reasons; dependency/runtime missing-lib error resolved.
* `pnpm lint` → ✅ PASS.
* `pnpm run test:ui:unit` → ✅ PASS (41 files / 217 tests).
* `pnpm run test:ui:coverage` → ✅ PASS (41 files / 217 tests; coverage thresholds met).
* `pnpm test` → ❌ FAIL (pre-existing workspace issue in `packages/expansion-01` and `packages/expansion-02`: `@balance-control/rules` entrypoint resolution under Vitest 0.30.1).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → ✅ PASS.
* `pnpm run test:ui:unit` → ✅ PASS.
* `pnpm run test:ui:coverage` → ✅ PASS.
* `pnpm run test:ui:e2e` → ❌ FAIL (functional E2E failures after dependency remediation; not an environment-lib restriction).

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

### A-01 — N/A

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
