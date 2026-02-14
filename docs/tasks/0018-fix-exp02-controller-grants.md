# Codex Task 0018 — Fix EXP-02 `CONTROLLER` grants: add explicit `missingController` policy (no throws)

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Canonical resolver: AGENTS 3.5, 3.6
- Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
- Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Context

Task 0016 hardened the resolver: any `resource.grant` targeting `playerId: 'CONTROLLER'` must declare an explicit
`missingController` policy (`ERROR | NOISE | SKIP`).

EXP-02 currently contains one or more `resource.grant` atoms with `playerId: 'CONTROLLER'` that do **not** declare
`missingController`, causing deterministic throws when a valid board state contains a tile with no controller.

This task is a **compatibility fix** for EXP-02 under the new resolver semantics. No design intent changes.

---

## Goal

1) Ensure **every** EXP-02 `resource.grant` atom targeting `CONTROLLER` declares explicit missing-controller behavior.
2) Default intent for EXP-02: if no controller exists, the grant must **not** occur (**SKIP**, not NOISE).
3) Add a regression test that proves EXP-02 does not crash on uncontrolled tiles under the hardened resolver.

---

## Inputs

- `packages/expansion-02/src/**` (EXP-02 module definitions, overlays/measures/modifiers)
- `packages/game/src/engine/types.ts` (atom typing incl. `missingController`)
- `packages/game/src/engine/resolver.ts` (strict enforcement)
- Existing tests and harness in `packages/game/test/*`

---

## Outputs

### A) Code changes (EXP-02)

In EXP-02 sources (typically `packages/expansion-02/src/index.ts` plus any submodules):

1. Find **every** atom:
- kind: `resource.grant`
- payload contains: `playerId: 'CONTROLLER'`

2. Add:
- `missingController: 'SKIP'`

Notes:
- Applies to positive and negative grant amounts (reductions).
- If there is no controller, there is nothing to reduce: **SKIP** is correct.

### B) Regression test

Add:

- `packages/game/test/exp02-controller-grants-no-throw.test.ts`

Test requirements:
- Enable EXP-02 in config (minimal setup).
- Construct a deterministic state where an EXP-02 effect path executes and targets a tile that is intentionally **uncontrolled**
  (no influence / no modifiers causing majority).
- Execute the step/phase that resolves the relevant EXP-02 effect (production hook, overlay effect, or measure resolve path—pick the smallest).
- Assert:
  - No exception is thrown.
  - No implicit NOISE grant occurs.
  - Player resources remain unchanged for that particular controller-targeted grant (SKIP semantics).

### C) Documentation updates

- Add `docs/tasks/0018-fix-exp02-controller-grants.md` with this contract + checklist.
- Update `docs/PR_TASK_LIST.md` to include Task 0018.
- Update `CHANGELOG.md` under **Unreleased**:
  - “Fix: EXP-02 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).”

---

## Constraints

- **No new mechanics.** Only explicit-policy annotation + tests.
- Must preserve determinism (no time/random).
- Must preserve expansion isolation (no new cross-package coupling beyond existing public types).
- Do not change ordering/timing of EXP-02 effects.

---

## Invariants

- Resolver stays strict: missing `missingController` on `CONTROLLER` grants continues to throw (Task 0016 remains valid).
- EXP-02 must not introduce new NOISE grants unless explicitly defined by its rules.
- Uncontrolled tiles must not crash controller-based EXP-02 hooks.

---

## Acceptance Criteria

1) There are **zero** EXP-02 `resource.grant` atoms with `playerId: 'CONTROLLER'` lacking `missingController`.
2) New test `exp02-controller-grants-no-throw` passes and fails on prior EXP-02 (pre-fix) behavior due to throw.
3) Full test suite passes.
4) Docs updated: Task file + PR task list + changelog.

---

## PR Checklist

- [x] Updated all EXP-02 `resource.grant` atoms targeting `CONTROLLER` to include `missingController: 'SKIP'`
- [x] Added deterministic regression test covering uncontrolled tile scenario under EXP-02
- [x] Verified no implicit NOISE grants occur from these atoms
- [x] `pnpm test` (repo standard) passes
- [x] `CHANGELOG.md` updated under Unreleased
- [x] `docs/PR_TASK_LIST.md` updated
- [x] Added `docs/tasks/0018-fix-exp02-controller-grants.md` and completed checklist after implementation
