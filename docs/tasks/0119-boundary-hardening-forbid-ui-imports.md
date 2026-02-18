# Task 0119 — Boundary hardening: Forbid engine-side imports from expansion /ui entrypoints

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0119-boundary-hardening-forbid-ui-imports`

---

**Task State:** DONE

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
* GR-003
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Engine-side code must not import UI/assets; enforce with tests/guards.
* GR-003: Guard is deterministic and static; does not affect gameplay behavior.
* GR-014: UI iconography stability: UI assets must remain isolated from engine dependencies.

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
* ARCH: ARCH-01:ENGINE/CLIENT SEPARATION, ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Add an explicit guard (test) that fails if any engine-side source imports from an expansion `/ui` entrypoint. This makes the intended pack boundary enforceable and prevents accidental asset/UI leakage into server/bot builds.

---

## 3) Non-Goals

* Do not ban legitimate engine imports (`/engine`).
* Do not expand the guard to unrelated packages (keep it focused on engine-side code paths).
* Do not add runtime checks; this must be a build/test-time guard.

---

## 4) Inputs

* Existing boundary tests:
  - `packages/game/test/pack-boundary-imports.test.ts`
  - `packages/game/test/pack-disablement-isolation.test.ts`
* Engine sources:
  - `packages/game/src/**`
* Expansion package naming scheme (`@balance-control/expansion-01`, etc.).

---

## 5) Outputs

* Updated or new test(s) that detect forbidden imports, at minimum:
  - Any import matching `@balance-control/expansion-0*/ui`
  - (Optionally) any import matching `@balance-control/*/ui` for future pack packages.
* Clear failure message listing offending file(s) and import(s).

---

## 6) Constraints (Hard)

* The guard must be deterministic and order-stable (sorted output).
* It must not require building `dist/` first; it should scan `src/`.
* Keep the allowed surface explicit: `/engine` is allowed; `/ui` is forbidden in engine-side code.

---

## 7) Invariants (Must remain true)

* Engine code remains free of UI/framework dependencies.
* Existing pack boundary import rules remain in effect.

---

## 8) Implementation Plan

1. Extend `packages/game/test/pack-boundary-imports.test.ts` (or add a sibling test) to scan imports in:
   - `packages/game/src/**` (at least `src/packs/**`, optionally all of `src/`).
2. For each import specifier found, fail if it matches:
   - `@balance-control/expansion-01/ui`
   - `@balance-control/expansion-02/ui`
   - `@balance-control/expansion-03/ui`
   - (Optionally) `@balance-control/*/ui`.
3. Ensure the failure list is sorted and includes file:line info when possible.
4. Run tests to confirm the guard passes in the clean state.

---

## 9) Acceptance Criteria

* [x] `pnpm -C packages/game test -- pack-boundary-imports.test.ts` passes.
* [x] The guard reliably fails when a forbidden `/ui` import is introduced (local validation).
* [x] Full test suite still passes (`pnpm -r --if-present test`).

---

## 10) PR Checklist (Repo Artifact)

- [x] I confirmed **Task State = FROZEN** before editing code.
- [x] I ran `pnpm -r build` and `pnpm -r --if-present test`.
- [x] I ran `pnpm run verify:docs` and `pnpm run verify:packs` (when applicable).
- [x] I updated **this task file** with Work Summary + Commands + Proof sections.
- [x] I added/updated tests to prevent regressions (or noted why not applicable).
- [x] The working tree is clean (`git status --porcelain` empty).

---

## 11) Work Summary (3–7 bullets)

- Created `packages/game/test/boundary-hardening-ui.test.ts`.
- Implemented a recursive scan of `packages/game/src` for `.ts` files.
- Added regex check for imports matching `@balance-control/expansion-*/ui` and `@balance-control/*/ui`.
- Verified the guard detects forbidden imports by creating a temporary violation file.
- Confirmed the guard passes on the clean codebase.

---

## 12) Commands Run (with outcomes)

- `pnpm -C packages/game test boundary-hardening-ui.test.ts` (PASS - clean state)
- `pnpm -C packages/game test boundary-hardening-ui.test.ts` (PASS - caught violation in temp file)
- `pnpm -r build` (PASS)
- `pnpm -r --if-present test` (PASS)
- `pnpm run verify:docs` (PASS)
- `pnpm run verify:packs` (PASS)

---

## 13) Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `git show -1 --stat`
- `pnpm -C packages/game test boundary-hardening-ui.test.ts`

---

## 14) Commit Proof (recorded in commit message)

- N/A (will be in commit message)

---

## 15) Amendments (append-only)

- (none)
