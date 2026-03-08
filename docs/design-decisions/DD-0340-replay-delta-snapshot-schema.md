# DD-0340 — Minimal deterministic replay delta/snapshot schema

## Status
Accepted — 2026-03-08

## Context

Replay verification currently validates action sequencing and optional hash checkpoints. For faster debugging and future incremental replay tooling, we need a compact deterministic state trace that stays strictly engine-authoritative and excludes presentation-only data.

## Decision

1. Extend engine replay action records with optional deterministic payload fields:
   - `stateDelta`: minimal changed/removed entries for `zones`, `resources`, `metaMarkers`.
   - `stateSnapshot`: periodic full snapshot over the same minimal surface.
2. Define snapshot projection centrally in `packages/game/src/engine/replay-sink.ts` using only authoritative state:
   - `zones[zoneId].items`
   - `objects` of type `Resource` (`owner`, `resort`, `zone`)
   - `objects` of type `MetaMarker` (`owner`, `measureId`, `playCount`, `targetTileId`, `mode`, `zone`)
3. Keep serialization deterministic by lexicographic key ordering and by deriving all values from post-move engine state.
4. Emit periodic `checkpoint` records directly from the replay hook when `snapshotEveryActions` is configured.
5. Extend verifier support:
   - validate `stateDelta` / `stateSnapshot` object shape on action records,
   - verify `checkpoint.stateSnapshot` (when present) against replayed engine state projection when checkpoint verification is enabled.

## Consequences

- Replay records can carry compact, deterministic state traces without leaking UI-only fields.
- Verifier can catch semantic state mismatches beyond hash-only checks.
- Server sink remains compatible because action/checkpoint records are still NDJSON and deterministic.
