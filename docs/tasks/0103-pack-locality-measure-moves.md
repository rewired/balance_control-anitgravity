# Task 0103 — Pack Locality: Shared Measure Moves + EXP-03 Move Placement

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0103-pack-locality-measure-moves`

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
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Move implementations remain in engine; only file locations and imports change.
* GR-002: Rule execution stays in `packages/game`; packs remain engine modules.
* GR-003: No semantic changes to move logic; determinism and INVALID_MOVE behavior remain identical.
* GR-012: Move availability continues to be gated by enabled packs and canonical config.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---
## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A
* EXP-01: EXP-01-06-01A (TakeMeasure/PlayMeasure scope), EXP-01-06-04 (TakeMeasure ends turn)
* EXP-02: N/A (uses shared Measure lifecycle from EXP-01)
* EXP-03: EXP-03-06-02 (PlayMeasure uses EXP-01 lifecycle)
* ARCH: ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---
## 2) Goal

* `takeMeasure` and `playMeasure` live under the packs module tree as shared engine logic (not in a top-level `src/expansion-moves.ts`).
* EXP-03-specific `placeCountdownMarker` move lives with EXP-03 pack code (not in a shared expansion move file).
* No callers outside packs rely on `src/expansion-moves.ts` (file removed).

---
## 3) Non-Goals

* No changes to move semantics, costs, prohibitions, usage limits, or turn flow.
* No renaming of move IDs (e.g. `exp01.takeMeasure`, `exp01.playMeasure` must remain stable).
* No new shared mechanics beyond relocating the existing ones.

---
## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/expansion-moves.ts`
  * `packages/game/src/packs/exp01/index.ts`
  * `packages/game/src/packs/exp02/index.ts`
  * `packages/game/src/packs/exp03/index.ts`
  * `packages/game/src/packs/pack-api.ts (from Task 0102)`
* Existing behavior summary (current):

  * `packs/exp01|exp02|exp03/index.ts` import `takeMeasure` / `playMeasure` (and EXP-03 `placeCountdownMarker`) from `src/expansion-moves.ts`.

---
## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/packs/_shared/measure-moves.ts (new: takeMeasure/playMeasure)`
* `packages/game/src/packs/exp03/moves.ts (new: placeCountdownMarker)`
* `packages/game/src/packs/exp01/index.ts (import from packs/_shared)`
* `packages/game/src/packs/exp02/index.ts (import from packs/_shared)`
* `packages/game/src/packs/exp03/index.ts (import shared measure moves + exp03 moves)`
* `packages/game/src/expansion-moves.ts (deleted)`
* `packages/game/src/packs/pack-api.ts (extend exports if shared moves need additional engine utilities)`

### 5.2 Tests

* `packages/game/test/legal-intents.test.ts (only if imports/exports require adjustments)`
* `packages/game/test/move-assembly-invariants.test.ts (only if module discovery changes)`

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
* Shared move implementations under `packs/_shared` must not import non-pack engine internals directly; use `pack-api.ts`.
* EXP-03 move file must remain EXP-03-scoped; no other pack imports it directly except via `packs/exp03/index.ts`.

---
## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.
* Move IDs exported by packs remain identical and stable (surface hash stability).

---
## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Create `packages/game/src/packs/_shared/measure-moves.ts` and move `takeMeasure` + `playMeasure` implementations from `src/expansion-moves.ts` into it (no logic changes).
* [ ] Create `packages/game/src/packs/exp03/moves.ts` and move `placeCountdownMarker` into it (no logic changes).
* [ ] Update `packs/exp01/index.ts`, `packs/exp02/index.ts`, `packs/exp03/index.ts` imports to use the new locations.
* [ ] Delete `packages/game/src/expansion-moves.ts` and ensure there are no remaining references.
* [ ] If shared moves need engine helpers (e.g. `EffectResolver`, `lookupMeasureDeckForObjectId`), import them via `packs/pack-api.ts` (not deep relative engine paths).
* [ ] Run `pnpm test` and confirm surface hash stability tests remain green.

Notes:

* If deleting `src/expansion-moves.ts` triggers any external import breakage, that is a smell: fix the import site to be pack-local, not by re-exporting a legacy shim.

---
## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `packages/game/src/expansion-moves.ts` no longer exists, and the build/test suite passes.
* [ ] `takeMeasure` / `playMeasure` reside under `packages/game/src/packs/_shared/measure-moves.ts` with identical semantics.
* [ ] `placeCountdownMarker` resides under `packages/game/src/packs/exp03/moves.ts` with identical semantics.
* [ ] Public surface hash and golden replays remain unchanged (unless an intentional, explained update is required).

---
## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] All move files relocated without semantic change (diff should be predominantly file moves + import rewires)
* [ ] No move IDs renamed
* [ ] No new exports that recreate a legacy shared expansion-moves shim
* [ ] `pnpm lint` passes
* [ ] `pnpm test` passes
* [ ] Surface hash stability tests pass
* [ ] No temporary files committed

---
## 11) Work Summary (3–7 bullets)

* <what changed>
* <why>

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → <ok/fail + details>
* `pnpm test` → <ok/fail + details>
* (optional) `pnpm vitest run <pattern>` → <ok/fail + details>

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

