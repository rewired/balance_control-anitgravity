# Codex Task 0015 — Fix Production: Uncontrolled ResortTile produces 0 (not Noise) + Tests

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Canonical resolver & effect ordering: AGENTS 3.5, 3.6
* Tests + golden replays + hashing: AGENTS 5.1–5.3
* Expansions modular + isolation (must not regress): AGENTS 3.4, 3.8, 5.4, 5.5

---

## Context

During detailed repo review, production resolution currently routes **base production to Noise** when a `ResortTile` is **uncontrolled** (no controller and no tie winners).
This violates CORE production semantics: **Uncontrolled ResortTiles produce 0**. Only *tie* produces split with remainder to Noise.

This is a **rules drift / bug**, not a balance change.

---

## Goal

1. Fix production resolution so that an **uncontrolled** `ResortTile` produces **0** resources (no bank grant, no Noise grant).
2. Add **unit coverage** and a **golden replay fixture** that would fail under the old behavior.
3. Update changelog + task list/checklist so this can’t “quietly” reappear.

---

## Inputs

* `/docs/rules/000-core.md`

  * CORE production section (the rule that defines: uncontrolled ⇒ 0; tie ⇒ split; remainder ⇒ Noise)
* Existing implementation:

  * `packages/game/src/engine/resolver.ts` (production resolution path; e.g. `handleProductionResolve`)
  * Any existing helper used to compute control/majority and tie winners.
* Test harness:

  * `packages/game/test/golden-replay.test.ts`
  * Existing fixtures + hashing utilities (`hash-state.ts` etc.)
  * Determinism policy tests

---

## Outputs

### A) Code fix

* Update `packages/game/src/engine/resolver.ts`:

  * In production resolve: **remove/disable** the branch that grants base production to Noise when `controller == null` and `tieWinners.length == 0`.
  * Ensure behavior is:

    * **Controlled by player P** → grant full production amount to P.
    * **Tie between players** → split evenly (floor division), remainder to Noise (only remainder, not full base).
    * **Uncontrolled (no majority)** → **grant nothing** (0).

### B) Unit test

Add a focused unit test file (or extend existing) under:

* `packages/game/test/production-uncontrolled.test.ts` (name flexible, but single-purpose)

Test must:

* Construct a minimal state where:

  * A `ResortTile` exists on Board.
  * There are **no Influence markers** (and no modifiers) producing a controller or tie.
  * Production step is executed.
* Assert:

  * No resources are added to any player.
  * No resources are added to Noise.
  * Bank totals remain consistent (i.e., no phantom grants).

### C) Golden replay fixture

Add a new golden fixture:

* `packages/game/test/fixtures/golden/production_uncontrolled_produces_zero.json` (or similar)

Fixture requirements:

* Deterministic seed.
* A replay that reaches a production phase with at least one uncontrolled `ResortTile`.
* Expected result must demonstrate:

  * Previously: Noise would increase (bug).
  * Now: Noise stays unchanged for that tile (correct).

Update:

* Expected hash / snapshot outputs as required by the golden test harness.

### D) Docs bookkeeping

* `CHANGELOG.md`:

  * Under `Unreleased`, add bullet:

    * “Fix: Uncontrolled ResortTile production now yields 0 (no Noise grant).”
* `docs/PR_TASK_LIST.md`:

  * Add Task 0015 entry and mark completion only once merged (or follow your repo convention).

---

## Constraints

* **No new mechanics.** This is a strict bug fix to match CORE.
* **No balancing changes** besides correcting the wrong branch.
* Must not change any unrelated resolver ordering.
* Must preserve determinism (no time-based IDs, no random outside seed).
* Must not break expansion isolation contracts (even if expansions aren’t used in the fixture).

---

## Invariants

* Production resolve is **purely derived** from game state and seeded RNG.
* **Uncontrolled** means:

  * `computeMajority(tile) == null` (or equivalent in code), and
  * `tieWinners.length == 0`.
* Noise only receives resources from:

  * **Remainders** in tie splits, and/or
  * Any other explicitly specified rule effect (not from “fallback production”).

---

## Acceptance Criteria

1. In production phase, an uncontrolled `ResortTile` produces **0** resources:

   * Player gains: 0
   * Noise gains: 0
2. Tie split behavior remains unchanged:

   * Even split to winners
   * Only remainder to Noise
3. Unit test `production-uncontrolled` passes and would fail on pre-fix code.
4. Golden replay suite passes (fixture added, hashes updated).
5. `pnpm test` (or repo standard) passes with no flakiness.

---

## PR Checklist

* [x] Production resolution updated with minimal diff (single branch removed/adjusted)
* [x] Added/updated unit tests covering uncontrolled production = 0
* [x] Added golden replay fixture demonstrating regression protection
* [x] Updated golden hashes/snapshots deterministically
* [x] `CHANGELOG.md` updated under Unreleased
* [x] `docs/PR_TASK_LIST.md` updated with Task 0015
* [x] Verified no other resolver behavior changed (tie + controlled cases still correct)
* [x] Verified determinism policy tests still pass
