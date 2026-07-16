# DD-0366 — CORE Extraction: Root-Pack Contract

**Date:** 2026-07-16
**Status:** Accepted
**Related:** `docs/hand-off/dependency-cut-map-core-extraction.md`, Task chain 0366–0375, stale precursor `docs/tasks/0098-expansions-first-class-packs.md` (FROZEN)

## Context

`CorePack` (`packages/game/src/packs/core/index.ts`) already registers CORE-01 through the same `EnginePackDefinition`/`EnginePackRegistry` mechanism as `Exp01/02/03Pack`, differing only by `manifest.required: true`. However, the bulk of CORE-01 domain logic (moves, mechanics, atoms, setup, legal-intent enumeration) still lives directly inside `packages/game/src` rather than in a package of its own, and the `Game<GameState>` factory (`packages/game/src/index.ts`, `createBalanceControlGameWithHooks`) hardcodes CORE-01 turn structure, win condition (`computeCoreGameover`), and player-view masking inline. This makes `packages/game` the CORE engine with a generic pack registry attached, not a ruleset-agnostic kernel. Expansions are real, separate workspace packages (`@balance-control/expansion-01/02/03`); CORE is not.

This DD freezes the contract and decisions needed to close that asymmetry across task chain 0366–0375.

## Decision 1 — Root-pack contract

Add optional fields to `EnginePackDefinition` (`packages/game/src/packs/types.ts`). Additive only — existing expansion packs are unaffected.

```ts
export type TurnStageDescriptor = Readonly<{ moves: string[]; next?: string }>;

export type RootTurnDescriptor = Readonly<{
    order: { first: (args: { G: GameState }) => number; next: (args: { ctx: any }) => number };
    activePlayers: Record<string, string>;
    stages: Record<string, TurnStageDescriptor>;
    rootMoveIds: string[];
    onBegin?: (args: { G: GameState; ctx: any; events: any }) => void;
    onEnd?: (args: { G: GameState; ctx: any }) => void;
}>;

// added to EnginePackDefinition:
turn?: RootTurnDescriptor;
endIf?: (args: { G: GameState }) => { winner: string } | { draw: true } | undefined;
playerView?: (G: GameState, playerID: string | null) => GameState;
enumerateIntents?: (G: GameState, ctx: any, playerID: string, stage: string) => any[];
```

Only the pack with `manifest.required === true` may populate `turn`/`endIf`/`playerView`. `EnginePackRegistry.validateEnabledPacks` rejects registration if more than one required pack defines any of these fields (there is currently exactly one required pack, `core`; this guards against future ambiguity, not a present bug).

`createBalanceControlGameWithHooks()` (`packages/game/src/index.ts`) resolves `turn`/`endIf`/`playerView` from the required pack via `EnginePackRegistry.getRegisteredPacks().find(p => p.manifest.required)` instead of hardcoding CORE specifics. The existing `buildStageMoveMap` (`move-assembly.ts`) is already stage-agnostic (nothing in it hardcodes stage names) and is reused as-is to merge the root pack's per-stage move IDs with expansion-contributed moves.

## Decision 2 — Topology stays in the kernel

`packages/game/src/topology.ts` (hex-grid math: `Coordinate`, `positionKey`, `getNeighbors`, `isSurrounded`) stays in the kernel as the shipped default topology, per AGENTS.md §1.4 ("Board adjacency uses pluggable topology. Default: Hex topology."). This is a kernel contract, not a per-ruleset one — 4 of 5 exports already carry `@remarks infrastructure; no direct SPEC binding`; the `@rule CORE-01-00-T07/T08` tags on the remaining two are spec *test-anchor* references (the rules doc's own topology-test numbering), not domain branching, and anchors travel with code regardless of which package a file lives in (`check-spec-anchors.mjs` scans all of `packages/` recursively).

Only `engine/topology.ts`'s `isMoveAdjacent` is split: a generic `isAdjacent(G, a, b): boolean` primitive (the base-adjacency check) stays in the kernel; the Start-Committee exclusion (CORE-01-08-06E) and Start-Bridge exception (CORE-01-04-12D) move to CORE as a thin wrapper calling the kernel primitive.

## Decision 3 — `'core'` special-casing in `expansion-registry.ts`: deferred

`EnginePackId` remains the closed union `'core' | 'exp01' | 'exp02' | 'exp03'` — this is pack identity, not package location, and is unaffected by where the pack's code physically lives. The asymmetric iteration in `applyEffect`/`applyProductionModifiers`/`getMeasureDeckDescriptors`/`getMeasureAtomsForExpansion` (iterate `CANONICAL_EXPANSION_ORDER`, excluding `core`) is deferred: CORE does not currently need to route effects/production through those generic paths (it dispatches via `EffectResolver`/atoms directly), and fixing it now would expand blast radius on the highest-risk migration in the repo's history for no immediate behavioral need. Documented here as a known residual asymmetry; re-raise only if a future pack (CORE or otherwise) actually needs it.

One narrow, low-risk exception fixed as part of this chain: `move-assembly.ts`'s `pack.id !== 'core'` string-identity check becomes `!pack.manifest.required` — needed anyway once `core` is an externally-registered pack rather than a kernel-local id, and it replaces a string special-case with the manifest flag that already exists for exactly this purpose.

## Decision 4 — Circular-import avoidance

`@balance-control/core` depends on `@balance-control/game` (runtime `dependencies`, for `EnginePackRegistry`, `EffectResolver`, shared types). `packages/game` gets **zero** dependency back on `@balance-control/core`, at any dependency level (not even `devDependencies`). This is resolved structurally, not via a special case:

**Correction (discovered during Task 0372 scaffolding):** the original text above claimed this mirrors "how expansion-01/02/03 depend on `@balance-control/game` today" — that is factually wrong and is corrected here. `packages/expansion-01/02/03` do **not** depend on `@balance-control/game` at all; they export a plain `ExpansionDefinition`-shaped object (types from `@balance-control/rules` only — resources, zones, measureDecks, modifiers, effectHandlers, getMeasureAtoms, onSetup) with zero engine coupling. It is `packages/packs/src/exp01.ts`/`exp02.ts`/`exp03.ts` — a separate adapter layer — that imports both the pure expansion package and `@balance-control/game`, wiring the few engine-dependent moves (e.g. `takeMeasure`/`playMeasure`) and assembling the real `EnginePackDefinition`.

CORE does not fit that "pure content + thin adapter" shape: unlike the lightweight expansions (a handful of measure definitions and two generic moves), CORE's content — turn structure, legal-intent enumeration, resolver atoms, most moves — is inherently and extensively engine-coupled; there is no meaningful "pure data" version of it analogous to `Expansion01`'s static tables. Splitting CORE the same way would mean relocating most of its logic into a `packages/packs/src/core.ts` adapter instead, which is a materially larger and different restructuring than extracting CORE into its own package — and was not what Tasks 0368–0371 built toward (all already route through `packages/game/src/packs/pack-api.ts`, assuming direct access to `@balance-control/game` internals). Decision, made explicitly here rather than silently: `packages/core` depends directly on `@balance-control/game`, the same way `packages/packs` (the expansions' adapter layer) already does — CORE plays the combined role of "pure content" and "adapter" in one package, proportionate to how deeply it's already coupled to the engine.

- Registration stays caller-driven: whoever calls `createBalanceControlGameWithHooks()` (client-web, server, tests, `packages/packs`) must register `CorePack` from `@balance-control/core` before calling it — exactly the pattern `packages/packs/src/index.ts` already uses for expansions via `registerCanonicalPacks()`.
- Kernel tests (`packages/game/test/**`) that today bootstrap the real `CorePack` (via `_helpers/registerPacks.ts`) are converted to synthetic `makeTestPack`/`dummyPacks.ts` fixtures (Task 0374) rather than depending on `@balance-control/core`, so the kernel package never needs the extracted package even in its test graph.

## Decision 5 — Kernel-test decontamination policy

After extraction, `packages/game/test/**` must contain no test that depends on a concrete ruleset pack. Tests exercising real CORE behavior move to `packages/core/test/`. Tests exercising genuine cross-pack composition (CORE + one or more expansions together) move to `packages/integration-tests/test/` if not already covered there. A static-analysis guardrail test (alongside the existing `pack-boundary-imports.test.ts`) asserts `packages/game/test/**` never imports `@balance-control/core`, making this policy self-enforcing going forward.

## Consequences

- `packages/game` becomes genuinely ruleset-agnostic: kernel wiring, pack registry, resolver dispatch order (GR-007), move assembly, replay/hash/config infra, default hex topology.
- `@balance-control/core` becomes structurally identical to `@balance-control/expansion-01/02/03` (`src/index.ts`, `src/engine/index.ts`, `src/ui/index.ts`, `test/`, `package.json` with `exports` for `.`/`./engine`/`./ui`).
- No behavior change is intended anywhere in this chain; every stage is verified against the golden replay fixture (must pass without regeneration) and the full 8-config cross-expansion matrix (AGENTS §5.4) before its commit.
- Closes out `docs/tasks/0098-expansions-first-class-packs.md` (FROZEN since 2026-02-17), whose goal this chain actually completes.
