# Dependency Cut Map — Extract CORE into `@balance-control/core`

**Skill:** S01 (Repo Scan & Ground Truth) + S02 (Dependency Cut Map)
**Date:** 2026-07-16
**Status:** Draft ground truth for planning — no code moved yet.

## 1) Boundary definition

Today, "Core" is split across two locations:

1. `packages/game/src/packs/core/**` — the `CorePack` wrapper (manifest, setup hooks, atom aggregation). This part already follows the pack pattern.
2. The bulk of `packages/game/src/**` — moves, mechanics, atoms, setup, and (critically) the `Game<GameState>` factory in `index.ts` itself contain CORE-01 domain logic inline, not routed through the pack system. `packages/game` is not currently a ruleset-agnostic kernel; it *is* the CORE engine, with a generic pack-registry bolted on for expansions.

**Target boundary:** `packages/game` becomes a ruleset-agnostic kernel (boardgame.io wiring, pack registry, resolver dispatch, move assembly, replay/hash/config infra). `@balance-control/core` becomes a package structurally identical to `@balance-control/expansion-01/02/03` (`src/engine/index.ts`, `src/index.ts`, `src/ui/index.ts`, `test/`), owning all CORE-01 domain content, registered as a pack like any other (already `required: true`).

This is a deeper cut than "move the `packs/core/` folder" — the `Game` factory in `packages/game/src/index.ts` must stop hardcoding CORE stage/move IDs, `endIf`, and `playerView` masking, and instead source them from the registered root/required pack(s).

## 2) File classification (baseline: grep count of `CORE-01-` / `CoreZoneName` occurrences as a specificity signal, cross-checked by reading)

### STAY — generic kernel infrastructure (0 CORE markers, used by every pack)
- `expansion-registry.ts` (the `EnginePackRegistry` itself)
- `move-assembly.ts`, `move-module-registry.ts`, `move-contracts.ts`
- `engine/engine-module-registry.ts`, `engine/types.ts`, `engine/selectors.ts`, `engine/replay-typed-fields.ts`, `engine/measure-deck-provider.ts`, `engine/cost-bucket-utils.ts`
- `hash-state.ts`, `config.ts`, `client-game.ts`, `boardgame-io.d.ts`, `surface.ts`, `replay.ts`, `replay-verify-cli.ts`
- `packs/types.ts` (pack contract types)
- `engine/resolver.ts`, `engine/resolver/{costs,ids,modifiers,prohibitions}.ts` — CPU order (Prohibition→Cost→Payment→Modifiers→Mutation) is a cross-pack contract (GR-007), not CORE-owned content
- `engine/replay-sink.ts` — generic infra; CORE-01 mentions are rule-tag comments on generic hooks, not domain logic

### MOVE — CORE-01 domain content → `@balance-control/core`
- `packs/core/**` (already CORE-scoped: manifest, tile-loader, setup hooks)
- `packs/pack-api.ts` — becomes unnecessary once atoms/moves live in the new package (CorePack imports them locally instead of reaching back into `packages/game` internals)
- `setup.ts` (`SetupGame`), `mechanics.ts`, `mechanics-turn.ts`, `mechanics-draw.ts`, `mechanics/conversion.ts`
- `moves.ts`, `moves/index.ts`, `moves/shared.ts`, `moves/stages/drawAndPlace.ts`, `moves/stages/politicalAction/**`, `moves/system/resolveChoice.ts`
- `engine/atoms/{resource,influence,production,measure,choice,hotspot,rules}.ts`
- `engine/core-module.ts` (Resort production module — CORE domain despite low grep-hit count; confirmed by read)

### DUPLICATE/ADAPT — mixed concern, needs splitting before moving (S02 guardrail: don't move files that mix concerns)
- `packages/game/src/index.ts` — the `Game<GameState>` factory. Contains generic wiring (pack assembly, move-map merge, replay hook plumbing) *and* hardcoded CORE specifics (`CORE_POLITICAL_MOVE_IDS`/`DRAW_AND_PLACE_MOVE_IDS`/`ROOT_SYSTEM_MOVE_IDS`, `computeCoreGameover`, `buildPlayerView` masking via `CoreZoneName`, turn `onBegin`/`onEnd` calling `drawTileToStaging`/`runFinalRoundSettlement` directly). **This is the highest-risk file** — needs a new contract (e.g. root pack supplies `stages`, `endIf`, `playerView`, `turn.onBegin/onEnd` hooks) so the kernel stays ruleset-agnostic.
- `engine/topology.ts` + top-level `topology.ts` — AGENTS.md §1.4 requires topology to be pluggable (`Adjacent(TileA,TileB) → Boolean`) independent of rules; current files likely mix the generic adjacency interface with CORE tile-placement specifics. Needs a read-through split: generic `Adjacent()` contract stays, CORE-specific placement legality moves.
- `engine/legal-intents.ts` — houses `enumerateLegalIntents` (GR-004: single canonical enumeration entrypoint). The harness/dispatch loop is generic; per-move legality bodies for CORE moves are domain content. Needs split: generic enumeration harness stays, CORE move-legality predicates move (already partly live in the moved `moves/stages/**`, if so this file may already be mostly generic — verify before moving anything).
- `state-lookup.ts`, `public-selectors.ts`, `replay-verify.ts` — low CORE-marker density; verify per-file whether the few CORE references are just comments/rule-tags (stay) or actual domain branching (extract a pure helper, then move only that piece).

### Already-partially-extracted primitives (naming legacy, not urgent)
- `engine/atoms/{regulation,countdown}.ts` are exported from `packages/game` as `exp02RegulationAtoms`/`exp03CountdownAtoms` and consumed by `packages/packs/src/exp02.ts`/`exp03.ts`. These are generic *mechanic primitives* (a regulation-zone mechanic, a countdown-zone mechanic), not CORE-01 content, so they correctly stay in the kernel — but the `exp02`/`exp03`-prefixed naming ties generic kernel primitives to specific expansion IDs. Not blocking; worth a rename to something ruleset-neutral (e.g. `regulationZoneAtoms`) in a later pass if we want the kernel vocabulary fully clean.

## 3) Inbound reference check (who reaches into `packages/game` internals?)

`rg -n "@balance-control/game/" packages/client-web/src packages/bot-llm/src` → **no hits**. Client and bot only import the public barrel (`@balance-control/game`), never deep paths. This means the extraction is safe to do without touching client-web/bot-llm imports, **as long as the public exports in `packages/game/src/index.ts` keep re-exporting what's needed** (`CorePack`, `EnginePackRegistry`, move-contracts, config, hash-state, surface, legal-intents, replay types) — those re-exports just change their *source* path (from local file to `@balance-control/core`), not their name.

`packages/packs/src/index.ts` imports `CorePack` from `@balance-control/game` (the barrel), not a deep path — so once `CorePack` is re-exported from the same barrel but sourced from `@balance-control/core` internally, `packages/packs` needs no change (or a one-line dependency addition if we choose to have it import `@balance-control/core` directly instead of via the game barrel — TBD in the plan).

## 4) Hard-stop list (must resolve first to make the cut safe)

1. **`packages/game/src/index.ts` needs a "root pack" contract** before anything else moves, otherwise CORE content can be relocated but the kernel still can't run without it hardcoded. This is the load-bearing design decision — should be written up as a DD doc before implementation.
2. **`engine/topology.ts` / `topology.ts` split** — must confirm the generic `Adjacent()` boundary (AGENTS §1.4) before moving either file wholesale.
3. **`engine/legal-intents.ts` split** — must confirm how much is generic enumeration harness vs. CORE-specific legality bodies.
4. **Circular-import risk**: `@balance-control/core` will depend on `@balance-control/game` (for `EnginePackRegistry`, resolver, types — same as expansion-01/02/03 do today), while `packages/game`'s `createBalanceControlGameWithHooks()` needs `CorePack` registered before it can build a `Game`. Must NOT have `packages/game` import `@balance-control/core` directly (that would be circular) — registration must stay caller-driven (as `packages/packs/src/index.ts` already does for expansions), i.e. whoever calls `createBalanceControlGameWithHooks()` (client-web, server, tests) must register `CorePack` from `@balance-control/core` before calling it, exactly like expansions.
5. **Spec anchors**: moving files does not change `@rule` tags, but `packages/rules/src/spec-anchors.generated.json` / `check:spec-anchors` may index by file path — must regenerate (`pnpm run gen:spec-anchors`) after the move and verify (`pnpm run check:spec-anchors`), per AGENTS.md §0.5.

## 5) Guardrails check (ARCH-00-MASTERPLAN-GUARDRAILS.json)

Potentially touched: **GR-001** (state authority — unaffected, no state shape change), **GR-002** (engine-only rule execution — explicitly permits packs; extraction is compliant, not a violation), **GR-004** (single legal-action interface — must survive the `legal-intents.ts` split intact), **GR-009** (zone invariants — unaffected), **GR-012** (match config canonical — unaffected). No guardrail is *violated* by this extraction; it is guardrail-compliant restructuring, but GR-002/GR-004 need explicit re-verification after the split (golden replay hash must stay identical — see S07).

## 6) Replacement plan (sketch, to be finalized in the task file)

1. Scaffold `packages/core` (package.json mirroring expansion-01's shape: deps on `@balance-control/rules` + `@balance-control/game`, `exports` for `.`, `./engine`, `./ui`).
2. Design the "root pack" contract addition to `EnginePackDefinition` (or a new `RootPackDefinition` extension) covering: turn stages, `endIf`, `playerView`, turn `onBegin`/`onEnd` hooks — write this as a DD doc first (load-bearing decision, hard-stop #1).
3. Move MOVE-list files into `packages/core/src`, updating imports to `@balance-control/game`'s public barrel only (no deep imports).
4. Split the two DUPLICATE/ADAPT files that block a clean cut (`topology.ts`, `legal-intents.ts`) — generic half stays, CORE half moves.
5. Rewrite `packages/game/src/index.ts` to consume the root-pack contract instead of hardcoding CORE specifics.
6. Update `packages/packs/src/index.ts` and any test bootstrap (`registerPacks.ts` helper) to register `CorePack` from `@balance-control/core`.
7. Regenerate spec anchors, run golden replay hash tests (S07) to prove zero behavior drift.
8. Docs: changelog entry, DD doc for the root-pack contract, close out stale `docs/tasks/0098-*.md` (FROZEN) referencing this work as its actual completion.

## 7) Risk list

- Circular-import risk: see hard-stop #4.
- Golden replay hash drift: any accidental behavior change during the split breaks S07 golden tests — must run cross-expansion matrix (AGENTS §5.4) after each stage.
- `packages/game/src/index.ts` rewrite is the single highest-risk change in this repo's history to date (touches turn structure, endIf, playerView for every match) — should be its own isolated task with maximum test coverage before/after diffing.
