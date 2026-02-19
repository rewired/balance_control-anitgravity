# Hand-off — Current Snapshot

## Last done

- **Task:** 0133
- **Date:** 2026-02-19

## Current state (facts)

- EnginePackRegistry is canonical (single registry) and enforces deterministic canonical ordering + duplicate checks.
- CORE tiles are loaded from JSON (`packages/game/src/packs/core/resources/core-tiles.json`) via `tile-loader.ts`.
- Measures: EXP-01..03 use builder maps (no switch); engine routes measure atoms via `EnginePackRegistry.getMeasureAtomsForExpansion(...)`.
- `scripts/verify-packs.mjs` imports from `@balance-control/game` public surface (no `game-dist` path).
- Deprecated exports `CoreZoneNames` / `CoreResources` from `@balance-control/rules` are still used in engine code + tests.
- Config `packs.enabledPacks` is now the canonical enablement surface. Runtime no longer reads `cfg.expansions` directly (except normalization).
- EnginePackRegistry still exposes deprecated `getMeasureAtoms(...)` API (should become unused before deletion).
- `@balance-control/game` still has hard dependencies on `@balance-control/expansion-01..03` (pack split not started).

## Decisions

### Binding

- **Pack split:** Option 2. Rule code may live in pack packages (`packages/expansion-*`), but the engine remains the only executor. (`ARCH-01` already reflects this.)

### Open

- How to remove the hard dependency `@balance-control/game -> @balance-control/expansion-*` (introduce a separate packs-aggregator package vs other split).

## Invariants (must not break)

- Build + tests stay green.
- No rules changes without SPEC anchor.
- Deterministic ordering and hashing stay stable (canonical pack order, deterministic shuffles, sorted lists).
- No client-side rule execution; engine stays authoritative (ARCH-01).

## Next packet goal

Deprecations Wave 1: migrate runtime + tests off legacy `cfg.expansions`, `CoreZoneNames/CoreResources`, and stop using deprecated `EnginePackRegistry.getMeasureAtoms(...)`.

## Mini diff map (likely touched)

- `packages/game/src/setup.ts`
- `packages/game/src/config.ts`
- `packages/game/src/expansion-registry.ts`
- `packages/game/src/engine/legal-intents.ts`
- `packages/game/src/moves/*`
- `packages/game/src/packs/core/index.ts`
- `packages/game/test/*`
- `scripts/verify-packs.mjs`
