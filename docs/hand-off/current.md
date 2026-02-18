# Hand-off — current

Date: 2026-02-19
Last completed task: 0127 (ARCH: allow pack-based rule execution)

## Current state (facts)
- EnginePackRegistry is canonical (order + duplicate checks); pack assembly is routed through the registry.
- `getMeasureAtomsForExpansion(expansionId, measureId, ...)` is the central dispatch hook; deprecated `getMeasureAtoms(...)` still exists.
- CORE tiles are still hardcoded via `generateCoreTiles()` in `packages/game/src/packs/core/index.ts`.
- EXP-01..03 measure atoms are still switch-based in `packages/expansion-xx/src/engine/index.ts`.
- Deprecated rules exports (CoreZoneNames/CoreResources etc.) are still used in code/tests.
- Config still carries legacy expansion flags; `packs.enabledPacks` exists and is used in some paths.
- `@balance-control/game` still depends directly on `@balance-control/expansion-01..03`.
- `scripts/verify-packs.mjs` imports packs via `packages/game/dist/*` and assumes packs are exported from the game bundle.

## Decisions (binding)
- **Pack-split direction:** Option 2 is permitted and is the target architecture: pack packages may include rule execution code, but execution remains *engine-owned* (ARCH-01).
- **Client boundary:** the client remains presentation-only; legality/cost/modifier evaluation stays in engine (`enumerateLegalIntents`).

## Open decisions (must be made explicit when they close)
- When we do the “real split”, do we:
  - A) keep a short-lived compatibility re-export layer in `@balance-control/game`, or
  - B) force all consumers to import packs directly from their pack packages immediately?

## Invariants (must not break)
- Determinism: identical move sequence → identical state hash.
- Authoritative state remains JSON-serializable and stays in `packages/game`.
- `packages/game/test/*` must remain expansion-independent.
- Canonical ordering: registry order and pre-shuffle ordering must remain deterministic and spec-anchored.

## Next packet goal

Packet 0128–0130 (prep for pack extraction):
- 0128: CORE tiles become data-driven (JSON + loader) and canonical pre-shuffle tie-break becomes SerialIndex-stable.
- 0129: EXP-01..03 measure dispatch becomes map-based (no switches) with minimal pack-local coverage tests.
- 0130: `verify:packs` stops importing dist file paths and uses the public `@balance-control/game` API surface.
