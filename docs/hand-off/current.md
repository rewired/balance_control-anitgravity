# Hand-off — Current Snapshot

## Last done

- **Task:** 0134
- **Date:** 2026-02-19

## Current state (facts)

- `@balance-control/packs` is the canonical entrypoint for pack exports and registration.
- `registerCanonicalPacks()` helper handles deterministic registration of all known packs (Core + Exp01..03).
- EnginePackRegistry is canonical (single registry) and enforces deterministic canonical ordering + duplicate checks.
- CORE tiles are loaded from JSON (`packages/game/src/packs/core/resources/core-tiles.json`) via `tile-loader.ts`.
- Measures: EXP-01..03 use builder maps (no switch); engine routes measure atoms via `EnginePackRegistry.getMeasureAtomsForExpansion(...)`.
- `scripts/verify-packs.mjs` imports from `@balance-control/packs` and uses `registerCanonicalPacks()`.
- Config `packs.enabledPacks` is the canonical enablement surface. Runtime no longer reads `cfg.expansions` directly (except normalization).
- Deprecated exports `CoreZoneNames` / `CoreResources` still exist in `@balance-control/rules`, but are no longer used by engine runtime/tests (migration completed).
- EnginePackRegistry still exposes deprecated `getMeasureAtoms(...)` API (tests should not use it; deletion is Wave 2).
- `@balance-control/game` still has hard dependencies on `@balance-control/expansion-01..03` (pack split not started).

## Decisions

### Binding

- **Pack split:** Option 2. Rule code may live in pack packages (`packages/expansion-*`), but the engine remains the only executor. (`ARCH-01` already reflects this.)
- **Canonical Pack Entrypoint:** `@balance-control/packs` is the single source of truth for app wiring.

### Open

- (None currently)

## Invariants (must not break)

- Build + tests stay green.
- No rules changes without SPEC anchor.
- Deterministic ordering and hashing stay stable (canonical pack order, deterministic shuffles, sorted lists).
- No client-side rule execution; engine stays authoritative (ARCH-01).

## Next packet goal

**Pack split Wave 1:** move real-pack tests out of `packages/game` and make engine tests pack-agnostic (Task 0135), then remove the hard dependency `@balance-control/game -> @balance-control/expansion-*` (Task 0136).

## Mini diff map (likely touched)

- `packages/packs/*` (new)
- `packages/server/src/boot.ts`
- `packages/client-web/src/game.ts`
- `scripts/verify-packs.mjs`
- `packages/integration-tests/test/*`
- `packages/game/test/*` (next task)
