# Task 0117 — EXP-03 package: Add /engine and /ui entrypoints; normalize TS config to runtime-safe module format

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0117-exp03-engine-ui-entrypoints`

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

* GR-001
* GR-002
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Expansion package remains content-only; authoritative state stays in packages/game.
* GR-002: Provide engine-only entrypoint and ensure module format is compatible with how packages/game loads expansions.
* GR-003: No non-deterministic behavior introduced while restructuring.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (wiring/structure task)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: SPEC-EXP-03 (003-expansion03.md)
* ARCH: ARCH-01:ENGINE/CLIENT SEPARATION, ARCH-01:DETERMINISM, ARCH-01:RULE EXECUTION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Prepare `@balance-control/expansion-03` as a pack package:
- Add `@balance-control/expansion-03/engine` and `/ui` entrypoints.
- Remove its dependency on `CoreZoneNames` for expansion zones.
- Normalize `packages/expansion-03/tsconfig.json` to a runtime-safe module output consistent with the monorepo.

---

## 3) Non-Goals

* No gameplay changes.
* Do not add UI/framework dependencies.
* Do not remove the existing root export path.
* Do not refactor `packages/game/src/packs/exp03/moves.ts` beyond import path updates (handled in 0118).

---

## 4) Inputs

* `packages/expansion-03/src/index.ts`
* `packages/expansion-03/tsconfig.json` (currently sets `module: ESNext`)
* `packages/expansion-03/package.json`

---

## 5) Outputs

* New files:
  - `packages/expansion-03/src/engine/index.ts`
  - `packages/expansion-03/src/ui/index.ts`
* Updated `packages/expansion-03/src/index.ts` to re-export from `./engine`.
* Updated `packages/expansion-03/tsconfig.json` (runtime-safe module output).
* (Optional but preferred) `exports` map for `.`, `./engine`, `./ui`.

---

## 6) Constraints (Hard)

* Ensure expansion build output is loadable by `packages/game` (CommonJS-compatible unless the package explicitly declares ESM).
* Replace all `CoreZoneNames.*` references with local constants while preserving string values.
* Keep strict typing and determinism tags/comments intact.

---

## 7) Invariants (Must remain true)

* Expansion identifiers and zone-name strings remain identical.
* No new random/time-based behavior.
* Build remains `tsc`-based.

---

## 8) Implementation Plan

1. Introduce `src/engine/index.ts` and move/re-export engine-safe exports from the current `src/index.ts`.
2. Add stub `src/ui/index.ts`.
3. Update root `src/index.ts` to re-export from `./engine`.
4. Replace `CoreZoneNames.*` references with local constants (preserve exact string values).
5. Remove unused imports (`CoreResources`, `CoreZoneNames`).
6. Update `tsconfig.json`:
   - Prefer `extends: ../../tsconfig.json` and remove `module: ESNext` override, OR set `compilerOptions.module` to `commonjs`.
7. (Optional) Add `exports` in `package.json` for `.`, `./engine`, `./ui`.
8. Run builds/tests.

---

## 9) Acceptance Criteria

* [ ] `pnpm -C packages/expansion-03 build` succeeds.
* [ ] `pnpm -r build` succeeds.
* [ ] `packages/expansion-03` no longer imports `CoreZoneNames`.
* [ ] `@balance-control/expansion-03/engine` resolves after build.
* [ ] Module output is compatible with the monorepo runtime (no ESM-in-CJS parse errors when loaded).

---

## 10) PR Checklist (Repo Artifact)

- [x] I confirmed **Task State = FROZEN** before editing code.
- [ ] I ran `pnpm -r build` and `pnpm -r --if-present test`.
- [ ] I ran `pnpm run verify:docs` and `pnpm run verify:packs` (when applicable).
- [ ] I updated **this task file** with Work Summary + Commands + Proof sections.
- [ ] I added/updated tests to prevent regressions (or noted why not applicable).
- [ ] The working tree is clean (`git status --porcelain` empty).

---

## 11) Work Summary (3–7 bullets)

- Created `src/engine/index.ts` and moved expansion logic there to separate engine concerns.
- Created `src/ui/index.ts` stub for future UI components.
- Updated `src/index.ts` to re-export from `./engine` and `./ui`.
- Replaced `CoreZoneNames` imports with local constants in `src/engine/index.ts` to reduce coupling.
- Updated `tsconfig.json` to remove `ESNext` overrides, ensuring CommonJS output compatible with the monorepo.
- Updated `package.json` to include `exports` map for `.`, `./engine`, and `./ui`.

---

## 12) Commands Run (with outcomes)

- `pnpm -r build` - Succeeded (verified full monorepo build).
- `pnpm -C packages/expansion-03 build` - Succeeded.
- Verified presence of `dist/engine/index.js` and `dist/ui/index.js`.


---

## 13) Postflight Proof (recorded in commit message)

- TODO: include command output labels: `git status -sb`, `git diff --stat`, `git show -1 --stat`, and test command(s).

---

## 14) Commit Proof (recorded in commit message)

- See commit message body.

---

## 15) Amendments (append-only)

- (none)
