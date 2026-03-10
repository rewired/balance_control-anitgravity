# DD-0364 — Hotseat replay forwarding integration test boundary

## Status
Accepted — 2026-03-10

## Context
Task 0364 requires explicit client-web coverage that a legal hotseat action emits replay records through the forwarding sink transport path (`navigator.sendBeacon` / `fetch`) while preserving the existing engine replay hook contract.

## Decision
Add a dedicated `packages/client-web` test that:
- anchors integration points `createClientGameWithReplayHooks`, `HotseatForwardingReplaySink`, and `withReplaySink`;
- executes a deterministic legal move in a hotseat-like player-view context (`_isPlayerView` with `_stateID` increment);
- mocks and verifies both forwarding channels (`sendBeacon` primary and `fetch` fallback);
- collects forwarded JSON replay records from fetch and asserts at least one `recordType: "action"` and one `checkpoint.turnEnd` record.

Footer assertion is guarded and enforced only when a footer record exists in the forwarded stream.

## Consequences
- No gameplay/rules behavior changes.
- Replay-forwarding behavior is now regression-tested from the client-web boundary.
- Deterministic replay semantics remain engine-owned; client test only validates transport-observable output.
