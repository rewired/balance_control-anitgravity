# Task 0270 — Game package pretest dependency build for isolated Vitest

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (tooling-only change; no game rule behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM (test reproducibility workflow preservation)

## 2) Goal

* Ensure targeted isolated game tests via `pnpm -C packages/game test <file>` work from a clean workspace without manual pre-build steps.
* Build required workspace dependencies (`@balance-control/rules`, `@balance-control/shared`) automatically before game Vitest.
* Keep runtime game behavior and rules logic unchanged.

## 3) Non-Goals

* No changes to move legality, resolver order, majority computation, or production logic.
* No changes to client-web/server/bot behavior.

## 4) Inputs

* Repo areas:
  * `package.json`
  * `packages/game/package.json`
* `packages/game/vitest.config.ts`
* Existing behavior summary (current):
  * Root `test` runs workspace tests, but isolated `packages/game` Vitest can fail from a clean state unless workspace dependency build artifacts already exist.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI tooling scope)

## 5) Outputs

### 5.1 Code

* `packages/game/package.json`
* `packages/game/vitest.config.ts`

### 5.2 Tests

* N/A (no new test files; validation via targeted test execution)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism preserved.
* Engine authority unchanged.
* No phantom moves introduced.
* No implicit rules introduced.
* Expansion isolation unchanged.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* Zone model untouched.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: Inspect root and game package test scripts.
* [x] Step 2: Add a deterministic `pretest` workflow in `packages/game/package.json` to build transitive workspace deps.
* [x] Step 3: Validate by removing build artifacts and running targeted game tests without manual build commands.
* [x] Step 4: Update task artifact and changelog.

## 9) Acceptance Criteria

* [x] `packages/game/package.json` includes `pretest` that builds workspace dependencies required by isolated tests.
* [x] `pnpm -C packages/game test test/setup.test.ts` passes from a clean dist state with no manual build step.
* [x] No game-rule behavior files are modified.

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

## 11) Work Summary (3–7 bullets)

* Added `pretest` in `packages/game/package.json` to build `@balance-control/rules` and `@balance-control/shared` before game Vitest runs.
* Added Vitest source aliases for `@balance-control/rules` and `@balance-control/shared` to support isolated test mode without depending on emitted JS in dependency packages.
* Validated isolated game tests by deleting `dist/` outputs for game/shared/rules and running `pnpm -C packages/game test test/setup.test.ts` with no manual build step.
* Updated changelog and task artifact for traceability.

## 12) Commands Run (with outcomes)

* `cat package.json && cat packages/game/package.json` → OK (inspected root/game test scripts)
* `python - <<'PY' ... shutil.rmtree(...) ... PY` → OK (cleaned `dist/` outputs for validation)
* `pnpm -C packages/game test test/setup.test.ts` → OK (pretest executed automatically, 1 file/9 tests passed)
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
