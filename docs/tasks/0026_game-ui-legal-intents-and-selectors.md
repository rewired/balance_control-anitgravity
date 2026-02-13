# Codex Task 0026 — Game UI Facade: Legal Intents + Selectors (Single Source of Truth)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* State model: CORE-01-00
* Turn structure: CORE-01-04
* Rule hierarchy / no implicit effects: CORE-01-10
* Topology contract: CORE-01-00-T01..T05

---

## Goal

Create a **UI/Bot-facing facade** in `packages/game` that provides:

1) a **pure** function to enumerate **legal actions/targets** ("legal intents") for a given player and current state, and  
2) a small set of **pure selectors** for common derived UI data.

This becomes the **single source of truth** for:
- client-web UI enablement and click-targets
- future local bot / LLM "pick from legal options"

No rules changes. No rebalancing. No new mechanics.

---

## Inputs

* Existing engine / state:
  - `GameState` in `@balance-control/rules`
  - `G.grid` coord -> tileId mapping (already used by the engine)
  - `packages/game/src/topology.ts` (coord parse + neighbors; must remain canonical)
  - Stages and stage guards already used by moves:
    - `drawAndPlace` (tile placement stage)
    - `politicalAction` (political action stage)
  - Move payload schemas in `packages/game/src/move-contracts.ts` (Task 0004)

* Current client-web UI is minimal and currently hardcodes some actions; it must stop guessing legality and instead consume the facade (Task 0027).

---

## Outputs

### A) New module: `packages/game/src/ui/legality.ts`

Create types and a pure API:

* `type StageName = ...` (string union of known stage names)
* `type Intent = ...` (serializable "what can I do and where")

Recommended minimal intent kinds (start small, extend later):
- `PlaceTile` with `{ targetCoord, extraResourceIds? }` (only if extra costs exist today; otherwise omit)
- `PassTilePlacement`
- `PlaceInfluence` with `{ targetTileId }`
- `Pass`

(Do NOT enumerate complex multi-step actions yet unless they are already fully deterministic and in use.)

**API (exact signature):**

```ts
export function enumerateLegalIntents(
  G: GameState,
  ctx: Ctx,
  playerID: PlayerID
): Intent[];
```

Rules:
- pure (no RNG, no time, no IO)
- deterministic ordering (stable sort; document the sort key per intent kind)
- stage-aware:
  - in `drawAndPlace`, only placement + pass placement
  - in `politicalAction`, only political intents (at minimum PlaceInfluence + pass)
- must not invent targets:
  - never hardcode Start Committee targeting
  - never emit coords that are not legal by the existing `placeTile` move
- must never include an intent that would return `INVALID_MOVE` when executed with the emitted payload

Implementation guidance (non-binding):
- Prefer reusing / extracting canonical helper(s) from existing move checks (e.g. placement adjacency, prohibition, Start Committee immunity) so enumeration and moves cannot drift.

### B) New module: `packages/game/src/ui/selectors.ts`

Add small pure selectors that help UI avoid re-deriving things:

- `selectStage(ctx, playerID) -> string | undefined` (reads `ctx.activePlayers[playerID]`)
- `selectStagedTileId(G, playerID) -> string | null` (reads `staging_<pid>` zone; return first item or null)
- `selectTileAtCoord(G, coord) -> string | null`
- `selectSortedBoardCoords(G) -> string[]` (lexicographic sort, stable)
- `selectBoardTileIdsByCoord(G) -> string[]` (derived from `selectSortedBoardCoords`)

### C) Export surface

Expose new APIs from `packages/game` public entry so `client-web` can import:

- `@balance-control/game/ui/legality`
- `@balance-control/game/ui/selectors`

Update `packages/game/package.json` exports and/or `packages/game/src/index.ts` as appropriate.

### D) Tests (game package)

Add unit tests (Vitest) for:

- deterministic ordering (same state => same intent list order)
- stage gating correctness:
  - if stage is `drawAndPlace`: no political intents
  - if stage is `politicalAction`: no tile placement intents
- Start Committee restriction guardrail for UI:
  - enumeration must not include `PlaceInfluence` targeting Start Committee if `placeInfluence` would reject it

Tests must not assert new rules; they must reflect current engine legality.

---

## Constraints

* Do not change any move logic or rules.
* Do not add new mechanics or hidden state.
* Enumeration must never include intents that would return `INVALID_MOVE` when executed.
* Keep intent payloads JSON-serializable.

---

## Invariants

* All state changes remain exclusively in `packages/game` moves.
* UI and Bot will read **only** `enumerateLegalIntents` + selectors for enablement / targets.
* Determinism preserved: ordering stable, no randomization.

---

## Acceptance Criteria

1. `pnpm -w test` green.
2. `enumerateLegalIntents` exists, pure, stable ordering, stage-aware.
3. Selectors exist and are exported.
4. No rules or moves were modified in behavior.

---

## PR Checklist

* [ ] Add `packages/game/src/ui/legality.ts` (types + enumeration)
* [ ] Add `packages/game/src/ui/selectors.ts`
* [ ] Export both modules from `@balance-control/game`
* [ ] Add vitest coverage for enumeration + ordering
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0026)
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green
