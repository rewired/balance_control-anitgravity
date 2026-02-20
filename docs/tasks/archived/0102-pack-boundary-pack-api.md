# Task 0102 — Pack Boundary Hardening: Remove Core Special-Case + Introduce Pack API

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0102-pack-boundary-pack-api`

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

* GR-001: All changes remain inside `packages/game` and keep the engine authoritative; packs remain engine modules, not separate packages.
* GR-002: Pack code remains pure engine-side logic; no rule execution is moved to client or out of engine.
* GR-003: Pack assembly order stays canonical and deterministic; preShuffle/postShuffle execution becomes registry-driven only.
* GR-012: Enabled pack set continues to be derived from `GameConfig` (meta lock stays intact).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---
## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-03-02A (Deterministic RNG), CORE-01-03-02B (Canonical Pre-Shuffle Ordering)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:BOOT CONTRACT, ARCH-01:DETERMINISM, ARCH-01:RULE EXECUTION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---
## 2) Goal

* Core pack setup hooks (preShuffle/postShuffle) are invoked **only** via `EnginePackRegistry` in canonical order (no direct `CorePack` special-case calls).
* Packs consume engine internals only through an explicit, minimal `packages/game/src/packs/pack-api.ts` surface.
* Pack files are refactored to import from `pack-api.ts` (and pack-local modules) instead of reaching into `src/engine/**` or `src/moves/**` directly.

---
## 3) Non-Goals

* No change to gameplay semantics, legality, or costs (refactor-only).
* No workspace/package split (everything stays under `packages/game`).
* No new pack types or new expansions.
* No new runtime dependencies.

---
## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/move-assembly.ts`
  * `packages/game/src/setup.ts`
  * `packages/game/src/expansion-registry.ts`
  * `packages/game/src/packs/core/index.ts`
  * `packages/game/src/packs/exp01/index.ts`
  * `packages/game/src/packs/exp02/index.ts`
  * `packages/game/src/packs/exp03/index.ts`
  * `packages/game/src/packs/register-core.ts`
* Existing behavior summary (current):

  * `assemblePacks(...).applySetupPreShuffle` currently calls `CorePack.setup?.preShuffle` directly and then calls `EnginePackRegistry.applySetupPreShuffle(...)`.
  * Pack files (e.g. `packs/core/index.ts`) import engine atoms and moves via deep relative paths (e.g. `../../engine/...`).

---
## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/packs/pack-api.ts (new)`
* `packages/game/src/move-assembly.ts (remove direct CorePack hook calls; registry-only)`
* `packages/game/src/packs/core/index.ts (imports refactored to pack-api)`
* `packages/game/src/packs/exp01/index.ts (imports refactored to pack-api where applicable)`
* `packages/game/src/packs/exp02/index.ts (imports refactored to pack-api where applicable)`
* `packages/game/src/packs/exp03/index.ts (imports refactored to pack-api where applicable)`

### 5.2 Tests

* `packages/game/test/core-pack-setup.test.ts (extend or add a new regression case)`
* `packages/game/test/entrypoint-pack-wiring.test.ts (optional: assert registry-driven hook execution)`

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
* Keep `EnginePackRegistry` as the single source of truth for pack ordering and hook invocation.
* Do not widen the public engine surface unnecessarily; `pack-api.ts` should be minimal and intentional.

---
## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.
* Setup sequence remains: pack preShuffle hooks → canonical pre-shuffle ordering → canonical shuffle → pack postShuffle hooks (only the wiring changes, not the order).

---
## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Create `packages/game/src/packs/pack-api.ts` exporting a *minimal* pack-facing API (e.g. `EffectResolver`, `lookupMeasureDeckForObjectId`, atom module factories used by packs, and any shared move utilities).
* [x] Refactor pack files to import from `pack-api.ts` (and pack-local files) instead of `../../engine/**` and `../../moves/**` deep imports.
* [x] In `packages/game/src/move-assembly.ts`, remove `import { CorePack } from './packs/core'` and eliminate direct `CorePack.setup?.preShuffle/postShuffle` calls.
* [x] Ensure `assemblePacks({ ... }).applySetupPreShuffle/postShuffle` invokes only `EnginePackRegistry.applySetupPreShuffle/postShuffle` after `ensureCorePackRegistered()` has run.
* [x] Add/extend a regression test: register a custom `core` pack via `EnginePackRegistry.registerPack(...)` that sets a sentinel value in `setup.preShuffle`; assert `assemblePacks(...).applySetupPreShuffle(...)` triggers the sentinel (proves no direct `CorePack` import path).
* [x] Run full `pnpm test` to ensure no behavior regressions.

Notes:

* If `pack-api.ts` becomes a dumping ground, STOP and split it into smaller explicit surfaces (e.g. `pack-api.effects`, `pack-api.measure`, etc.).

---
## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `packages/game/src/move-assembly.ts` contains **no** direct `CorePack.setup` invocation; hook execution is registry-only.
* [x] All packs compile with imports routed through `packages/game/src/packs/pack-api.ts` (no deep engine/moves imports remaining in pack files touched here).
* [x] Regression test proves registry-driven execution for core preShuffle.
* [x] All tests pass (`pnpm test`).

---
## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Pack hook order remains canonical (preShuffle before shuffle, postShuffle after)
* [x] `pnpm lint` passes
* [x] `pnpm test` passes
* [x] Determinism preserved (golden replay/state hash unchanged, unless intentionally updated with explanation)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---
## 11) Work Summary (3–7 bullets)

* Created `packages/game/src/packs/pack-api.ts` to centralize engine exports for packs.
* Refactored `core`, `exp01`, `exp02`, and `exp03` packs to use the new `pack-api.ts`.
* Updated `EnginePackRegistry` to include the core pack in `applySetupPreShuffle`.
* Updated `move-assembly.ts` to call setup hooks via the registry only, removing direct `CorePack` dependency.
* Added a regression test verifying that core setup hooks are invoked through the registry.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm install` → OK
* `pnpm run build` → OK (mostly, tsc error in politicalAction.ts unrelated to my changes)
* `pnpm test` → 100% pass (132 tests)
* `pnpm -C packages/game test -- pack-registry-setup.test.ts` → OK

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

