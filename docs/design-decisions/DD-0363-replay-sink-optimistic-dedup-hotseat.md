# DD-0363 — Replay sink optimistic dedup without dropping hotseat canonical action

- **Date:** 2026-03-10
- **Status:** Accepted
- **Task:** 0363

## Context

`withReplaySink` previously skipped replay emission for every move when `G._isPlayerView` was true. In hotseat flows this can be the only observable move path reaching replay forwarding (`HotseatForwardingReplaySink`), causing legal committed actions to disappear from replay logs.

## Decision

Replace blanket `_isPlayerView` suppression with deterministic `_stateID`-based filtering:

1. Skip optimistic no-commit passes when `_isPlayerView` is true **and** `_stateID` does not change across move call.
2. Skip stale/duplicate passes when post-move `_stateID` is less than or equal to the last recorded state version.
3. Record action/checkpoint normally for committed state transitions (including `_isPlayerView` paths) and preserve monotone `seq` assignment per recorded action.

## Consequences

- Hotseat committed legal moves are no longer silently dropped.
- Optimistic duplicates are still filtered deterministically.
- Server multiplayer remains compatible: authoritative committed moves continue to be recorded once.
- Footer/action-count parity remains enforceable (`totalActions === number of action records`).

## Alternatives Considered

- **Keep blanket `_isPlayerView` guard**: rejected because it drops valid hotseat committed actions.
- **Use time-based dedup keys**: rejected as non-deterministic and guardrail-incompatible.
