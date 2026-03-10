# DD-0362 — Replay validator deterministic invariants and fixture gate

## Status
Accepted — 2026-03-10

## Context
Replay verification already enforced strict sequencing and optional checkpoint hash checks, but deterministic invariant coverage was incomplete for move-specific and intent/tile-binding guarantees. Task 0362 requires fail-fast invariant checks with contextual diagnostics and CI-time validation of canonical replay fixtures.

## Decision
1. Extend `verifyReplayRecords` with fail-fast invariant checks that include `recordIndex` and key identifiers (`seq`, `turn`, `round`, `tileId`, `player`) in divergence messages.
2. Enforce replay invariants in the verifier:
   - `placeInfluence(applied)` must yield `personalSupply -1`, `board +1`.
   - `moveInfluence(applied)` must preserve total board influence and enforce source/target tile influence binding updates.
   - `system.roundSettlement.perTile.length > 0` requires `boardTileCount > 0` from authoritative state projection.
   - move intents with required tile bindings must reference tiles currently present in Board zone.
   - checkpoint summaries must be recomputed from authoritative state and matched exactly to record payloads.
3. Add canonical replay fixture validation test coverage in `packages/game/test` so fixture verification runs on every package test run and therefore on CI `pnpm test`.

## Consequences
- Replay verification now fails earlier and with stronger diagnostics on first deterministic mismatch.
- Canonical replay fixtures are continuously checked during normal test execution.
- Existing callers that omitted `verifyCheckpoints` now receive checkpoint-summary validation by default.
