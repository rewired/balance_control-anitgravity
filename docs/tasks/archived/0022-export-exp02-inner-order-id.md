# Codex Task 0022 — EXP-02: Export canonical Inner Order Tile ID + use it in regression test

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
* Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Context

Task 0021 fixed an EXP-02 bug by unifying the Inner Order hotspot tile id to `tile_inner_order` via a local constant:

* `export const EXP02_TILE_INNER_ORDER_ID = 'tile_inner_order' as const;`

The regression test (`packages/game/test/exp02-hotspot-ids.test.ts`) currently hardcodes the same string.
That is fine, but it leaves a small footgun: future refactors could rename the id and update only one side.

We want **one single source of truth** that is used by both the expansion code and its tests.

---

## Goal

1. Export the canonical Inner Order tile id from EXP-02 in a stable way.
2. Update the regression test to import and use that exported constant (no more string literal).
3. Ensure no dependency cycles are introduced.

---

## Inputs

* `packages/expansion-02/src/index.ts`

  * current `EXP02_TILE_INNER_ORDER_ID` constant
* `packages/game/test/exp02-hotspot-ids.test.ts`

  * currently uses `'tile_inner_order'` string literal
* Existing package boundaries and build setup (tsconfig, exports)

---

## Outputs

### A) Export the constant from EXP-02

In `packages/expansion-02/src/index.ts`:

* Change from local const to exported const:

```ts
export const EXP02_TILE_INNER_ORDER_ID = 'tile_inner_order' as const;
```

Replace internal uses to reference the exported const (same identifier, so minimal diff).

If the repo prefers a dedicated constants module, you may instead:

* create `packages/expansion-02/src/constants.ts`
* export `EXP02_TILE_INNER_ORDER_ID` from there
* re-export from `src/index.ts` if needed
  …but keep it minimal and consistent with existing patterns.

### B) Update regression test to import the constant

In `packages/game/test/exp02-hotspot-ids.test.ts`:

* Replace all occurrences of `'tile_inner_order'` with `EXP02_TILE_INNER_ORDER_ID`.
* Import it from EXP-02 package entry (preferred), e.g.:

```ts
import { Expansion02, EXP02_TILE_INNER_ORDER_ID } from '@bc/expansion-02';
```

(or the correct import path used elsewhere in repo).

### C) Ensure no dependency cycles

* Tests are allowed to import expansions.
* EXP-02 must not import from `@bc/game` test code.
* Keep exports clean; do not introduce cross-package runtime coupling.

### D) Documentation updates

* Add `docs/tasks/0022-export-exp02-inner-order-id.md` containing this contract + checklist.
* Update `docs/PR_TASK_LIST.md` to include Task 0022.
* Update `CHANGELOG.md` under **Unreleased**:

  * “Hardening: EXP-02 exports canonical Inner Order tile id and tests use it (single source of truth).”

---

## Constraints

* No new mechanics. This is pure hardening / maintainability.
* Deterministic behavior unaffected.
* Minimal diff: do not refactor unrelated EXP-02 code.
* Preserve public API stability as much as possible.

---

## Invariants

* Inner Order tile id remains `tile_inner_order`.
* Task 0021 regression coverage remains intact (still validates handler actually triggers).
* Build/test remains green.

---

## Acceptance Criteria

1. `EXP02_TILE_INNER_ORDER_ID` is exported from EXP-02 and used internally.
2. Regression test imports and uses the exported constant (no string literal in test).
3. Full test suite passes.
4. Docs updated: Task doc + PR task list + changelog.

---

## PR Checklist

* [x] Exported `EXP02_TILE_INNER_ORDER_ID` from `@bc/expansion-02`
* [x] Updated internal EXP-02 references to use the exported constant (no duplicates)
* [x] Updated `exp02-hotspot-ids.test.ts` to import and use the constant
* [x] Verified no dependency cycles introduced
* [x] `pnpm test` passes
* [x] Updated `CHANGELOG.md` (Unreleased)
* [x] Updated `docs/PR_TASK_LIST.md`
* [x] Added `docs/tasks/0022-export-exp02-inner-order-id.md` and completed checklist after implementation
