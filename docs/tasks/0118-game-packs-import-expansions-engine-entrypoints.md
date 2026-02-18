# Task 0118 — Game packs: Import expansions via /engine entrypoints (remove UI-leak risk)

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0118-game-packs-import-expansions-engine-entrypoints`

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

* GR-001
* GR-002
* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Keep authoritative rule execution in packages/game; only switch import paths.
* GR-002: Ensure packs in packages/game only import engine-safe content from expansion packages.
* GR-003: No behavior change; only wiring/import changes.
* GR-012: PackSelection remains canonical; pack assembly remains deterministic.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (wiring-only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:ENGINE/CLIENT SEPARATION, ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM, ARCH-01:MATCH CONFIG CANONICAL

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Update engine pack adapters in `packages/game/src/packs/exp01..exp03` to import expansion definitions from the new engine-only entrypoints (`@balance-control/expansion-0x/engine`). This makes pack boundaries explicit and prepares later removal/reduction of the adapter layer.

---

## 3) Non-Goals

* Do not change pack behavior, move lists, or rule logic.
* Do not introduce new adapter helpers.
* Do not change canonical pack ordering/registration.

---

## 4) Inputs

* `packages/game/src/packs/exp01/index.ts`
* `packages/game/src/packs/exp02/index.ts`
* `packages/game/src/packs/exp03/index.ts`
* Any other engine imports of `@balance-control/expansion-0x` (search & update).
* (If needed) `packages/game/tsconfig.json` path mappings.

---

## 5) Outputs

* Updated imports to use `@balance-control/expansion-01/engine`, `/expansion-02/engine`, `/expansion-03/engine`.
* Pack tests updated if any string snapshots/expected imports changed.
* No consumer-facing API change in `@balance-control/game`.

---

## 6) Constraints (Hard)

* Only import from `/engine` in engine-side code.
* No imports from `/ui` in `packages/game`.
* Keep pack manifests and RULESET_MANIFEST usage unchanged.
* Run `verify:packs` after building.

---

## 7) Invariants (Must remain true)

* Pack behavior and determinism remain unchanged.
* Pack boundary tests continue to pass.
* Disabled packs remain leak-free (no unintended imports).

---

## 8) Implementation Plan

1. Update `packages/game/src/packs/exp01/index.ts` import from `@balance-control/expansion-01` → `@balance-control/expansion-01/engine`.
2. Repeat for `exp02` and `exp03`.
3. Search `packages/game/src` for any other `@balance-control/expansion-0x` imports and update to `/engine` where the import is used in engine/runtime code.
4. If TypeScript resolution fails, add minimal `paths` entries in `packages/game/tsconfig.json` for the new subpaths pointing to the built d.ts outputs.
5. Run builds/tests and `pnpm run verify:packs`.

---

## 9) Acceptance Criteria

* [x] `pnpm -r build` succeeds.
* [x] `pnpm -r --if-present test` succeeds.
* [x] No `packages/game/src/**` file imports `@balance-control/expansion-0x/ui`.
* [x] `pnpm run verify:packs` succeeds after build.

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

- Updated `packages/game/src/packs/exp0x/index.ts` to import from `@balance-control/expansion-0x/engine` instead of root.
- Updated `packages/game/tsconfig.json` to map `@balance-control/expansion-0x/engine` to `dist/engine/index.d.ts` and removed root mappings.
- Updated `packages/server/tsconfig.json` to include engine mappings.
- Updated `packages/client-web/tsconfig.json` to map engine imports to `src/engine` for development.
- Updated `packages/client-web/vite.config.ts` to include engine aliases (placed before root aliases for correct resolution).
- Updated `packages/game/vitest.config.ts` to include engine aliases for tests.
- Verified build and tests pass, confirming no UI code leakage into engine paths.

---

## 12) Commands Run (with outcomes)

- `pnpm -r build` -> Success (after fixing vite aliases)
- `pnpm -C packages/game test` -> Success (36 passed)
- `pnpm run verify:packs` -> Success

---

## 13) Postflight Proof (recorded in commit message)

- See commit message body for `git status -sb`, `git diff --stat`, and test outputs.

---

## 14) Commit Proof (recorded in commit message)

- See commit message body.

---

## 15) Amendments (append-only)

- (none)
