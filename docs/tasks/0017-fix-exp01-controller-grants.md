# Codex Task 0017 — Fix EXP-01 `CONTROLLER` grants: add explicit `missingController` policy (no throws)

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Canonical resolver: AGENTS 3.5, 3.6
* Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
* Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Context

Task 0016 introduced hardening: any `resource.grant` targeting `playerId: 'CONTROLLER'` must specify an explicit `missingController` policy (`ERROR | NOISE | SKIP`).
In EXP-01, there are still `resource.grant` atoms with `playerId: 'CONTROLLER'` **without** `missingController`. This can now deterministically throw when the targeted tile has no controller.

This task is a **compatibility fix** for EXP-01 under the new resolver semantics. No design intent changes.

---

## Goal

Update EXP-01 so that all `resource.grant` atoms targeting `CONTROLLER` declare explicit missing-controller behavior, and ensure gameplay does **not** crash in valid states where a tile has no controller.

Default intent for EXP-01: if there is no controller, the grant should **not** occur (i.e., **SKIP**, not NOISE).

---

## Inputs

* `packages/expansion-01/src/index.ts` (EXP-01 module definitions; measures/modifiers)
* `packages/game/src/engine/types.ts` (atom typing: `missingController` policy)
* `packages/game/src/engine/resolver.ts` (enforcement behavior)
* Existing tests under `packages/game/test/*` (including 0016 hardening tests)

---

## Outputs

### A) Code changes (EXP-01)

In `packages/expansion-01/src/index.ts`:

1. Find **every** `resource.grant` atom with:

* `playerId: 'CONTROLLER'`

2. Add:

* `missingController: 'SKIP'`

This includes (non-exhaustive, must be exhaustive in implementation):

* Any `onProduction` modifiers using controller-based grants
* Any measure effects that apply controller-based grants or reductions (including negative amounts)

**Rule for negative amounts:** still `missingController: 'SKIP'` (if nobody controls, there is nothing to reduce).

### B) Add a regression test

Add a new test file:

* `packages/game/test/exp01-controller-grants-no-throw.test.ts`

Test requirements:

* Enable EXP-01 in game config (minimal setup).
* Create a board state with:

  * At least one `ResortTile` that will trigger an EXP-01 controller-based modifier/grant (choose the smallest existing hook used by EXP-01).
  * Ensure that tile has **no controller** (no influence / modifiers that create a majority).
* Execute the phase/step that resolves the relevant effect (production or the effect resolution path used by the modifier).
* Assert:

  * No exception is thrown.
  * No resources are granted to NOISE as a fallback.
  * Player resources remain unchanged for that effect (SKIP behavior).

Keep the test deterministic and minimal.

### C) Documentation updates

* Add `docs/tasks/0017-fix-exp01-controller-grants.md` with this contract + checklist.
* Update `docs/PR_TASK_LIST.md` to include Task 0017.
* Update `CHANGELOG.md` under **Unreleased**:

  * “Fix: EXP-01 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).”

---

## Constraints

* **No new mechanics.** This is an explicit-policy annotation and regression test only.
* Must not alter EXP-01 balance or timing.
* Must preserve expansion isolation: do not import game internals beyond existing public contracts/types.
* Determinism must be maintained (no time/random).

---

## Invariants

* Resolver remains strict: missing `missingController` on `CONTROLLER` grants continues to throw (Task 0016 stays valid).
* EXP-01 effects must not produce new NOISE grants unless explicitly defined by rules.
* Uncontrolled tiles do not trigger implicit controller-based transfers.

---

## Acceptance Criteria

1. In `packages/expansion-01/src/index.ts`, there are **zero** `resource.grant` atoms with `playerId: 'CONTROLLER'` lacking `missingController`.
2. New test `exp01-controller-grants-no-throw` passes and would fail on the previous EXP-01 implementation (due to throw).
3. Full test suite passes.
4. Docs updated: Task file + PR task list + changelog.

---

## PR Checklist

* [x] Updated all EXP-01 `resource.grant` atoms targeting `CONTROLLER` to include `missingController: 'SKIP'`
* [x] Added deterministic regression test covering uncontrolled tile scenario under EXP-01
* [x] Verified no NOISE fallback grants occur from these atoms
* [x] `pnpm test` (repo standard) passes
* [x] `CHANGELOG.md` updated under Unreleased
* [x] `docs/PR_TASK_LIST.md` updated
* [x] Added `docs/tasks/0017-fix-exp01-controller-grants.md` and completed checklist after implementation
