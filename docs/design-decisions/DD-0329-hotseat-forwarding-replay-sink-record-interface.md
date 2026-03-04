# DD-0329 — Client-web hotseat replay sink adopts `ReplayRecord` `writeRecord` contract

## Context

`@balance-control/game` evolved the replay sink contract to `ReplaySink.writeRecord(record: ReplayRecord)`, allowing both action and system replay record types to pass through one interface. The client-web hotseat forwarding sink still exposed `writeAction(record: ReplayActionRecord)`, creating a stale API surface and TypeScript mismatch risk.

## Decision

1. Update `HotseatForwardingReplaySink` to implement `writeRecord(record: ReplayRecord)`.
2. Import `ReplayRecord` and `ReplaySink` from `@balance-control/game`.
3. Preserve existing transport behavior exactly: JSON payload forwarded to `/api/replay/hotseat` using `navigator.sendBeacon` first and `fetch(..., { method: 'POST', keepalive: true })` fallback.
4. Keep `HotseatShell` sink construction unchanged (`new HotseatForwardingReplaySink()`).

## Consequences

- Client-web stays interface-compatible with replay sink evolution in `@balance-control/game`.
- Hotseat forwarding can transparently carry non-action replay records when emitted.
- No UI behavior, endpoint wiring, or game logic semantics are changed.
