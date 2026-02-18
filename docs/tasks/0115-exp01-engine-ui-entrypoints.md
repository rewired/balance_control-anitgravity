# Task 0115 — EXP-01 package: Add /engine and /ui entrypoints; stop importing core expansion zones

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0115-exp01-engine-ui-entrypoints`

---

**Task State:** DRAFT

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
* GR-002
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Keep expansion package content declarative; no engine state authority moved into the expansion package.
* GR-002: Provide a clean engine-only entrypoint so `packages/game` never needs to import any UI/asset code from EXP-01.
* GR-003: Expansion definition remains deterministic (pure data/handlers).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (pack wiring change only)
* EXP-01: SPEC-EXP-01 (001-expansion01.md) — any identifiers referenced must remain consistent
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM, ARCH-01:ENGINE/CLIENT SEPARATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Prepare `@balance-control/expansion-01` to act as a real pack package by introducing dedicated entrypoints:
- `@balance-control/expansion-01/engine` (engine-safe exports)
- `@balance-control/expansion-01/ui` (future UI/assets; can be a stub for now)
…and remove its dependency on `CoreZoneNames` for expansion zones.

---

## 3) Non-Goals

* No gameplay logic changes inside EXP-01.
* Do not introduce React/Vite dependencies into the expansion package.
* Do not delete the existing root export path (`@balance-control/expansion-01`).

---

## 4) Inputs

* `packages/expansion-01/src/index.ts`
* `packages/expansion-01/package.json`
* `packages/expansion-01/tsconfig.json`
* `packages/rules` exports for zone/resource typing (as affected by 0113/0114).

---

## 5) Outputs

* New files:
  - `packages/expansion-01/src/engine/index.ts`
  - `packages/expansion-01/src/ui/index.ts`
* Updated `packages/expansion-01/src/index.ts` to re-export from `./engine` for backwards compatibility.
* Package wiring so imports like `@balance-control/expansion-01/engine` resolve after build (via `exports` map or by ensuring emitted dist structure is importable).

---

## 6) Constraints (Hard)

* Keep existing API available at `@balance-control/expansion-01`.
* `ui` entrypoint must not be imported by `packages/game`.
* Expansion-specific zone names must be defined locally (strings/constants) instead of relying on `CoreZoneNames` which is being deprecated for pack extraction.
* All outputs must compile with `tsc` (no `any`-only hacks).

---

## 7) Invariants (Must remain true)

* EXP-01 identifiers (measure ids, zone names used by engine) remain unchanged in value.
* No new random/time-based behavior.
* Package builds via `pnpm -C packages/expansion-01 build`.

---

## 8) Implementation Plan

1. In `packages/expansion-01/src/engine/index.ts`, export the engine-safe symbols currently exported from `src/index.ts` (e.g. `Expansion01`, any constants used by engine packs).
2. Add `packages/expansion-01/src/ui/index.ts` as a stub (export an empty object or placeholder type), with a comment explaining it is intentionally UI-only.
3. Change `packages/expansion-01/src/index.ts` to re-export from `./engine` to keep the old import path stable.
4. Replace uses of `CoreZoneNames.*` in EXP-01 with local constants (string literals) that keep the exact same zone-name values.
5. Remove unused imports (`CoreResources`, `CoreZoneNames`) from EXP-01.
6. (Optional but preferred) Add an `exports` map in `packages/expansion-01/package.json` for `.`, `./engine`, `./ui` pointing to `dist/*` outputs.
7. Build the expansion and run the workspace build/tests.

---

## 9) Acceptance Criteria

* [ ] `pnpm -C packages/expansion-01 build` succeeds.
* [ ] `pnpm -r build` succeeds.
* [ ] No import of `CoreZoneNames` remains in `packages/expansion-01`.
* [ ] The root import `@balance-control/expansion-01` still works (backwards compatible).
* [ ] The subpath import `@balance-control/expansion-01/engine` works after build.

---

## 10) PR Checklist (Repo Artifact)

- [ ] I confirmed **Task State = FROZEN** before editing code.
- [ ] I ran `pnpm -r build` and `pnpm -r --if-present test`.
- [ ] I ran `pnpm run verify:docs` and `pnpm run verify:packs` (when applicable).
- [ ] I updated **this task file** with Work Summary + Commands + Proof sections.
- [ ] I added/updated tests to prevent regressions (or noted why not applicable).
- [ ] The working tree is clean (`git status --porcelain` empty).

---

## 11) Work Summary (3–7 bullets)

- TODO

---

## 12) Commands Run (with outcomes)

- TODO

---

## 13) Postflight Proof (recorded in commit message)

- TODO: include command output labels: `git status -sb`, `git diff --stat`, `git show -1 --stat`, and test command(s).

---

## 14) Commit Proof (recorded in commit message)

- TODO

---

## 15) Amendments (append-only)

- (none)
