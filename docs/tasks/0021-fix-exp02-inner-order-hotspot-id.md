# Codex Task 0021 — EXP-02: Fix Inner Order Hotspot Tile-ID mismatch + mini regression test

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Canonical resolver & effect ordering: AGENTS 3.5, 3.6
* Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
* Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Context

In `packages/expansion-02/src/index.ts`, EXP-02 setup creates the Inner Order Hotspot with:

* `const innerOrderId = 'tile_inner_order';`

But the EXP-02 `effectHandlers.HOTSPOT_RESOLUTION` checks a different, legacy German id variant.

Result: the Inner Order hotspot created during setup is **not recognized** by the handler, so the hotspot’s resolution logic can silently no-op.

This is not a balance issue. It’s a string drift bug.

---

## Goal

1. Make the Inner Order Hotspot use **one canonical tile id** consistently in setup and effect handling.
2. Add a **mini regression test** that fails if setup id and handler id diverge again.

---

## Inputs

* `packages/expansion-02/src/index.ts`

  * `onSetup` Inner Order Hotspot creation
  * `effectHandlers.HOTSPOT_RESOLUTION` Inner Order branch
* Existing test harness:

  * `packages/game/src/setup.ts` (SetupGame)
  * `packages/game/src/expansion-registry.ts` (expansion enable/registry)
  * `packages/game/src/mechanics.ts` (`computeMajority`)
  * Vitest setup in `packages/game/test/*`

---

## Outputs

### A) Code fix (EXP-02)

In `packages/expansion-02/src/index.ts`:

1. Introduce a single constant near the top (ASCII only, no umlauts):

```ts
const EXP02_TILE_INNER_ORDER_ID = 'tile_inner_order' as const;
```

2. Replace all occurrences accordingly:

* In `onSetup`: use `EXP02_TILE_INNER_ORDER_ID`
* In `effectHandlers.HOTSPOT_RESOLUTION`: check against `EXP02_TILE_INNER_ORDER_ID` (not the German variant)

3. Ensure there is **no remaining** legacy mismatched tile-id literal in the repo after this change.

### B) Mini regression test

Add a new test:

* `packages/game/test/exp02-hotspot-ids.test.ts`

Test requirements:

* Register EXP-02 via `ExpansionRegistry.register(Expansion02)`.
* Call `SetupGame({ ctx, setupData: { expansions: { ex02: true } } })` with deterministic ctx shuffle (identity is fine).
* Assert Inner Order tile exists in `G.tiles['tile_inner_order']`.
* Place a single Influence for player `"0"` onto the tile zone `G.zones['tile_inner_order']` to make it controlled.
* Call `Expansion02.effectHandlers.HOTSPOT_RESOLUTION(...)` directly with:

  * `effect.payload.tileId = 'tile_inner_order'`
  * `effect.payload.action = 'place'`
  * `effect.payload.regType = 'SecurityLevel'` (valid `RegulationType`)
  * `effect.payload.targetTileId = <any stable id>` (does not need to exist for this unit test)
  * `utils = { computeMajority }`
* Assert: `G.engine.effectQueue` gained entries, at minimum:

  * one `{ kind: 'resource.pay', ... }`
  * one `{ kind: 'regulation.place', ... }`

**Why this test is sufficient:**
If the handler uses the wrong id, the queue stays unchanged (no-op), and the test fails loudly.

### C) Docs bookkeeping

* Add `docs/tasks/0021-fix-exp02-inner-order-hotspot-id.md` containing this contract + checklist.
* Update `docs/PR_TASK_LIST.md` to include Task 0021.
* Update `CHANGELOG.md` under **Unreleased**:

  * “Fix: EXP-02 Inner Order Hotspot id now matches between setup and HOTSPOT_RESOLUTION handler; added regression test.”

---

## Constraints

* No new mechanics, no rebalance, no timing/order changes.
* Deterministic behavior only (test must not rely on real RNG).
* Keep fix minimal (string/id unification only).
* Do not introduce cross-package coupling; use existing imports (`SetupGame`, `ExpansionRegistry`, `computeMajority`, `Expansion02`).

---

## Invariants

* Setup creates the Inner Order Hotspot and it is resolvable by the handler using the same id.
* Hotspot resolution still only triggers when `computeMajority(...).controller` exists (unchanged).

---

## Acceptance Criteria

1. Inner Order Hotspot id is **identical** in setup and handler (`tile_inner_order`).
2. `packages/game/test/exp02-hotspot-ids.test.ts` passes and would fail on the current buggy mismatch.
3. Full test suite passes (`pnpm test` or repo standard).
4. Task doc + PR task list + changelog updated.

---

## PR Checklist

* [x] Added `EXP02_TILE_INNER_ORDER_ID = 'tile_inner_order'` constant
* [x] Replaced setup and handler checks to use the constant
* [x] Removed all occurrences of the legacy mismatched hotspot id literal
* [x] Added regression test `exp02-hotspot-ids.test.ts`
* [ ] Verified test fails pre-fix and passes post-fix
* [x] `pnpm test` passes
* [x] Updated `CHANGELOG.md` (Unreleased)
* [x] Updated `docs/PR_TASK_LIST.md`
* [x] Added `docs/tasks/0021-fix-exp02-inner-order-hotspot-id.md` and completed checklist after implementation

---
