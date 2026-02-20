# Codex Task 0016 — Hardening: Prevent implicit `CONTROLLER -> NOISE` fallback drift

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Canonical resolver: AGENTS 3.5, 3.6
* Tests + golden replays + hashing: AGENTS 5.1–5.3
* Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5

---

## Context

We fixed the production bug in Task 0015 (uncontrolled production must yield 0, not Noise).
However, the resolver still contains a **generic implicit fallback**:

> If an atom targets `playerId: 'CONTROLLER'` and there is **no** controller, it silently reroutes to `NOISE`.

That default is a drift magnet: one “refactor to atoms” later and the old bug is back—quietly.

---

## Goal

Make the resolver **explicit** about what happens when `CONTROLLER` is missing:

* **No silent reroute to Noise.**
* Any fallback to Noise must be **opt-in per atom**.
* Add tests that fail loudly if someone reintroduces implicit fallback behavior.

---

## Inputs

* `/docs/rules/000-core.md` (production semantics already fixed in 0015; this task is hardening, not new rules)
* `packages/game/src/engine/resolver.ts`

  * the mapping logic that currently converts missing `CONTROLLER` into `NOISE`
* `packages/game/src/engine/core-module.ts`

  * contains `productionAtoms` (currently unused but risky)
* Atom/type definitions used by resolver (wherever `resource.grant` payload is typed)
* Test harness in `packages/game/test/*`

---

## Outputs

### A) Resolver hardening (remove implicit fallback)

**Change in `packages/game/src/engine/resolver.ts`:**

1. Extend the `resource.grant` atom payload (or the smallest equivalent structure) to include:

* `missingController: 'ERROR' | 'NOISE' | 'SKIP'`

2. New resolution rule:

* If `atom.playerId !== 'CONTROLLER'`: unchanged.
* If `atom.playerId === 'CONTROLLER'`:

  * If controller exists: grant to controller (unchanged).
  * If controller does **not** exist:

    * If `missingController === 'NOISE'`: grant to `NOISE` (explicit opt-in).
    * If `missingController === 'SKIP'`: skip the grant (no-op).
    * If `missingController === 'ERROR'` or field is missing:

      * Throw a deterministic error (include atom kind + any stable source tag/id; **no timestamps**).

**Default must be strict:** missing field behaves as `ERROR`.
This is the point: force explicitness.

### B) Remove / neutralize drift bait

In `packages/game/src/engine/core-module.ts`:

* Either delete `productionAtoms` if truly unused, **or**
* Keep it but refactor it so it no longer uses implicit semantics:

  * Any `playerId: 'CONTROLLER'` must specify `missingController` explicitly (and for production it must be `SKIP`, never `NOISE`).

Additionally: add a brief comment explaining why `missingController` is mandatory for `CONTROLLER`.

### C) Tests: “tripwire” coverage

Add tests (names flexible):

1. `packages/game/test/controller-fallback-hardening.test.ts`

* Case 1: `resource.grant` to `CONTROLLER` with **no controller** and **no `missingController` field**
  → must throw (deterministic error).
* Case 2: same but `missingController: 'SKIP'`
  → must not throw, must not grant to anyone.
* Case 3: same but `missingController: 'NOISE'`
  → must grant to Noise (explicit behavior).

2. Ensure Task 0015 tests still pass (uncontrolled production stays 0). No regressions.

### D) Docs bookkeeping

* Add `docs/tasks/0016-hardening-controller-fallback.md` with this contract and checklist.
* Update `docs/PR_TASK_LIST.md` to include Task 0016.
* Update `CHANGELOG.md` under **Unreleased**:

  * “Hardening: `CONTROLLER` grants now require explicit missing-controller behavior; no implicit reroute to Noise.”

---

## Constraints

* **No new mechanics.** This is strict hardening of resolver semantics.
* Must preserve determinism: error messages must be stable; no time/random.
* Must not alter production logic beyond what 0015 already fixed.
* Keep changes minimal and localized (resolver + atom typing + tests).
* Expansion modules must remain isolated; do not introduce cross-module imports.

---

## Invariants

* Uncontrolled ResortTile production remains **0** (Task 0015 remains true).
* Noise only receives resources when a rule explicitly grants to Noise

  * e.g. tie remainder, or explicit `missingController: 'NOISE'`.
* Any future use of `playerId: 'CONTROLLER'` is forced to make an explicit decision.

---

## Acceptance Criteria

* No code path implicitly converts missing `CONTROLLER` into `NOISE`.
* Tests confirm:

  * Missing `missingController` on a `CONTROLLER` grant throws.
  * Explicit `SKIP` and `NOISE` behave as specified.
* Full test suite passes (`pnpm test` or repo standard).
* Changelog + PR task list + Task doc are updated.

---

## PR Checklist

* [x] Resolver updated: implicit `CONTROLLER -> NOISE` removed
* [x] `resource.grant` payload supports `missingController`
* [x] All internal usages of `playerId: 'CONTROLLER'` updated with explicit `missingController`
* [x] `core-module.ts` drift bait removed or made explicit-safe
* [x] Added hardening tripwire tests (throw/skip/noise)
* [x] Task 0015 production tests still pass
* [x] `CHANGELOG.md` updated
* [x] `docs/PR_TASK_LIST.md` updated
* [x] Task doc added and checklist completed

---
