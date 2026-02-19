# Hand-off — Current Snapshot

## Last done

- **Task:** 0137
- **Date:** 2026-02-19

## Current state (facts)

- `@balance-control/game` no longer depends on `@balance-control/expansion-*` (fully decoupled).
- `EnginePackRegistry` is the canonical registry in `packages/game`, but only knows expansion IDs (no logic coupling).
- Deprecated `EnginePackRegistry.getMeasureAtoms(...)` has been removed.
- Pack wrappers (`Exp01Pack` etc.) are implemented in `@balance-control/packs` and import engine definitions from expansion packages.
- `@balance-control/packs` is the canonical entrypoint for pack exports and registration.
- `registerCanonicalPacks()` helper handles deterministic registration of all known packs (Core + Exp01..03).
- Config `packs.enabledPacks` is the canonical enablement surface. Runtime no longer reads `cfg.expansions` directly (except normalization).
- Deprecated exports `CoreZoneNames` / `CoreResources` still exist in `@balance-control/rules`, but are no longer used by engine runtime/tests (migration completed).

## Decisions

### Binding

- **Pack split:** Option 2. Rule code may live in pack packages (`packages/expansion-*`), but the engine remains the only executor. (`ARCH-01` already reflects this.)
- **Canonical Pack Entrypoint:** `@balance-control/packs` is the single source of truth for app wiring.
- **EnginePackRegistry Location:** Stays in `packages/game` as the kernel registry mechanism; logic is generic (iterating canonical IDs).

### Open

- (None currently)

## Invariants (must not break)

- Build + tests stay green.
- No rules changes without SPEC anchor.
- Deterministic ordering and hashing stay stable (canonical pack order, deterministic shuffles, sorted lists).
- No client-side rule execution; engine stays authoritative (ARCH-01).

## Next packet goal

**Cleanup Wave 3:** Remove `CoreZoneNames` / `CoreResources` deprecated exports from `@balance-control/rules` (Task 0138+).

## Mini diff map (likely touched)

- `packages/game/src/expansion-registry.ts`
- `packages/rules/src/index.ts` (future)
