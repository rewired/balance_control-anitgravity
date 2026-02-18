# Hand-off — current

Date: 2026-02-18
Last completed task: 0124 (integration-tests package for real pack combinations)

## Current state (facts)
- EnginePackRegistry is canonical (order + duplicate checks); pack assembly works via registry.
- Measure dispatch is expansion-scoped via getMeasureAtomsForExpansion(expansionId, measureId, ...).
- packages/game/test/* are expansion-independent; real pack combinations are tested in packages/integration-tests.
- Core tiles are still hardcoded via generateCoreTiles() in packages/game/src/packs/core/index.ts.
- EXP-01..03 measure atoms are still switch-based in packages/expansion-xx/src/engine/index.ts.
- Deprecated rules exports (CoreZoneNames/CoreResources etc.) are still used in code/tests.
- Legacy config flags for expansions still exist alongside packs.enabledPacks.
- @balance-control/game still depends on @balance-control/expansion-01..03 (must be removed for full decoupling).

## Decisions (binding)
- We will change ARCH-01: rule execution is allowed to live in pack packages (packages/expansion-*) and be loaded/registered by the engine, while the client remains presentation-only.
- We will pursue the “real split”: /packages/game/src/packs/* will be moved into pack packages (expansion-core, expansion-01..03) as first-class packages.

## Invariants (must not break)
- Determinism: identical move sequence → identical state hash.
- Authoritative state remains JSON-serializable and stays in packages/game.
- Client must not compute legality/costs/modifiers; legality via enumerateLegalIntents only.
- packages/game/test/* must remain expansion-independent.

## Next packet goal
- Packet 0126–0127: Update ARCH-01 to reflect pack-based rule execution, and add docs/hand-off baseline to the repo.
