# Task 0105 — Pack Boundary Guards: Enforce Imports + Leak-Free Disabled Packs

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0105-pack-boundary-guards`

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

* GR-001: Packs remain engine modules and are prevented (by tests) from reaching into arbitrary engine internals.
* GR-002: Rule execution remains engine-only; boundary checks ensure the client cannot become a rule execution backdoor.
* GR-003: Boundary enforcement is deterministic: violation lists are sorted and stable across runs.
* GR-012: Disabled pack isolation is tested against config-driven enablement (no accidental leaks).

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
* ARCH: ARCH-01:STATE AUTHORITY, ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM, ARCH-01:LEGALITY ENUMERATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---
## 2) Goal

* A deterministic test suite enforces pack import boundaries (no deep imports into `src/engine/**`, `src/moves/**`, etc.).
* A deterministic test suite asserts that disabled packs do not leak moves, hooks, modifiers, or measure decks even if registered.
* Boundary violations fail fast with a stable, readable error list.

---
## 3) Non-Goals

* No changes to pack gameplay logic (this is enforcement + tests).
* No ESLint rule authoring unless it is already used in the repo; enforcement is via vitest.
* No runtime behavior changes; only tests (and any minimal rewires needed to satisfy the tests).

---
## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/packs/** (pack source tree)`
  * `packages/game/src/packs/pack-api.ts`
  * `packages/game/src/expansion-registry.ts (enablement + hooks surface)`
  * `packages/game/test/** (vitest suite)`
* Existing behavior summary (current):

  * Pack files can currently import engine internals via `../../engine/...` etc unless a reviewer notices.
  * Some isolation tests exist (e.g. legal intents gating), but boundary leaks via modifiers/hooks are not comprehensively guarded.

---
## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/packs/** (only if needed to satisfy new boundary test; expected minimal)`

### 5.2 Tests

* `packages/game/test/pack-boundary-imports.test.ts (new)`
* `packages/game/test/pack-disablement-isolation.test.ts (new)`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---
## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions unless explicitly defined by SPEC.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled packs must not leak moves, hooks, modifiers, zones, resources, decks.
* Do not add runtime dependencies.
* Boundary enforcement MUST be deterministic: sort paths and violations lexicographically before failing.
* Do not introduce new dev dependencies; implement scans with Node fs/path.
* Allowed relative imports from pack files are restricted to pack-local (`./`), `../pack-api`, `../types`, and `../_shared/*`.
* Disallow any relative import that escapes the packs root (`../../*` and beyond).
* Disallow cross-pack imports (e.g. `../exp02/*`) except via `../_shared/*`.

---
## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.
* Enabled/disabled pack semantics remain config-driven and unchanged.

---
## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Add `packages/game/test/pack-boundary-imports.test.ts` that scans `packages/game/src/packs/**/*.ts` for `import ... from '...'` statements.
* [ ] Implement an allowlist for import specifiers: bare imports are allowed; relative imports are allowed only if they match: `./*`, `../pack-api`, `../types`, `../_shared/*`.
* [ ] Fail the test with a deterministic, multi-line error list: `<file>: <import>`; sorted by file then import.
* [ ] Add `packages/game/test/pack-disablement-isolation.test.ts` that registers packs but runs with configs where packs are disabled; assert no leaks via:
* [ ]   - `EnginePackRegistry.getEnabledMoveModules(config)` (moves)
* [ ]   - `EnginePackRegistry.getMeasureDeckDescriptors(config)` (decks)
* [ ]   - `EnginePackRegistry.applyProductionModifiers(..., config)` (modifiers; should be no-op when disabled)
* [ ]   - `EnginePackRegistry.applyProhibitions(..., config)` and/or other hook surfaces present (should be no-op when disabled)
* [ ] Use minimal stub packs in tests (via `makeTestPack` helper from Task 0104) that expose a unique move ID / deck descriptor / modifier so leaks are detectable.
* [ ] Run `pnpm test` and confirm the new tests are green and stable.

Notes:

* Keep the import scan simple and robust: a regex-based parser is acceptable if it is well documented and deterministic.

---
## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Import-boundary test fails if any pack file imports `../../engine/**`, `../../moves/**`, or escapes packs root.
* [ ] Import-boundary test fails if any pack imports a sibling pack directly (except `../_shared/*`).
* [ ] Disablement-isolation test proves that disabled packs do not contribute moves, deck descriptors, modifiers, or prohibitions/hooks.
* [ ] All tests pass (`pnpm test`).

---
## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] pack-boundary-imports.test.ts added and deterministic
* [x] pack-disablement-isolation.test.ts added and covers moves + decks + modifiers/hooks
* [x] Any boundary violations fixed without expanding pack API unnecessarily
* [x] `pnpm lint` passes
* [x] `pnpm test` passes
* [x] No temporary files committed

---
## 11) Work Summary (3–7 bullets)

* Created `pack-boundary-imports.test.ts` to enforce strict import rules for pack files.
* Created `pack-disablement-isolation.test.ts` to ensure disabled packs do not leak logic into the engine.
* Verified that existing packs are compliant with the new boundary rules.
* Ensured that the `EnginePackRegistry` correctly handles expansion-to-flag mapping (`exp01` -> `ex01`).
* Improved the boundary test to be flexible for subdirectories within a pack while still preventing cross-pack and root-escaping imports.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm install` → ok
* `pnpm build` → ok
* `pnpm test` → ok (all 35 test files passed in `packages/game`)
* `pnpm vitest packages/game/test/pack-boundary-imports.test.ts` → ok

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file. Record them in the final commit message under a `Postflight:` block (amend message only, no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` output inside the same `Postflight:` block in the final commit message.

---

## 15) Amendments (append-only)

### A-01 — Initial Draft

* Reason: task created.

