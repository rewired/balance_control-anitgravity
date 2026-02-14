# Codex Task 0019 — Fix EXP-03 `CONTROLLER` grants: add explicit `missingController` policy (no throws)

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

Task 0016 hardened the resolver: any `resource.grant` atom targeting `playerId: 'CONTROLLER'` must include an explicit
`missingController` policy (`ERROR | NOISE | SKIP`).

EXP-03 contains one or more controller-targeted grants without this policy, which can deterministically throw on
valid states where the target tile has no controller.

This task is a **compatibility fix** for EXP-03 under the hardened resolver. No design intent changes.

---

## Goal

1) Ensure **every** EXP-03 `resource.grant` atom targeting `CONTROLLER` declares explicit missing-controller behavior.
2) Default intent for EXP-03: missing controller => **SKIP** (no grant), unless EXP-03 rules explicitly require NOISE.
3) Add a regression test that proves EXP-03 does not crash on uncontrolled tiles under the hardened resolver.

---

## Inputs

- `packages/expansion-03/src/**` (EXP-03 module definitions, measures, modifiers)
- `packages/game/src/engine/types.ts` (atom typing incl. `missingController`)
- `packages/game/src/engine/resolver.ts` (strict enforcement)
- Existing tests and harness in `packages/game/test/*`

---

## Outputs

### A) Code changes (EXP-03)

In EXP-03 sources (typically `packages/expansion-03/src/index.ts` plus any submodules):

1. Find **every** atom:
- kind: `resource.grant`
- payload contains: `playerId: 'CONTROLLER'`

2. Add:
- `missingController: 'SKIP'`

Notes:
- Applies to both positive and negative grant amounts.
- If EXP-03 has any effect that *intentionally* routes to NOISE when no controller, it must set:
  - `missingController: 'NOISE'`
  and the task must include an inline comment pointing at the exact rule reference in `/docs/rules/003-expansion03.md`.

### B) Regression test

Add:

- `packages/game/test/exp03-controller-grants-no-throw.test.ts`

Test requirements:
- Enable EXP-03 in config (minimal setup).
- Construct a deterministic state where an EXP-03 effect path executes and targets a tile that is intentionally **uncontrolled**
  (no influence / no majority).
- Execute the relevant resolution step (production hook, measure resolve, or modifier evaluation—pick the smallest).
- Assert:
  - No exception is thrown.
  - No implicit NOISE grant occurs (unless explicitly configured by policy in code and justified by rule).
  - Player resources remain unchanged for SKIP semantics.

### C) Documentation updates

- Add `docs/tasks/0019-fix-exp03-controller-grants.md` with this contract + checklist.
- Update `docs/PR_TASK_LIST.md` to include Task 0019.
- Update `CHANGELOG.md` under **Unreleased**:
  - “Fix: EXP-03 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).”

---

## Constraints

- **No new mechanics.** Only explicit-policy annotation + tests.
- Must preserve determinism (no time/random).
- Must preserve expansion isolation.
- Do not change timing/order of EXP-03 effects.

---

## Invariants

- Resolver stays strict: missing `missingController` on `CONTROLLER` grants continues to throw.
- EXP-03 must not create new implicit NOISE routes.
- Uncontrolled tiles must not crash controller-based EXP-03 hooks.

---

## Acceptance Criteria

1) There are **zero** EXP-03 `resource.grant` atoms with `playerId: 'CONTROLLER'` lacking `missingController`.
2) New test `exp03-controller-grants-no-throw` passes and fails on pre-fix behavior due to throw.
3) Full test suite passes.
4) Docs updated: Task file + PR task list + changelog.

---

## PR Checklist

- [x] Updated all EXP-03 `resource.grant` atoms targeting `CONTROLLER` to include `missingController: 'SKIP'` (or `NOISE` with explicit rule citation)
- [x] Added deterministic regression test covering uncontrolled tile scenario under EXP-03
- [x] Verified no implicit NOISE grants occur from these atoms
- [x] `pnpm test` (repo standard) passes
- [x] `CHANGELOG.md` updated under Unreleased
- [x] `docs/PR_TASK_LIST.md` updated
- [x] Added `docs/tasks/0019-fix-exp03-controller-grants.md` and completed checklist after implementation
