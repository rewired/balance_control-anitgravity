# DD-0330 — Replay filename helper accepts `ReplayRecord`

- **Date:** 2026-03-04
- **Status:** Accepted
- **Task:** 0330

## Context

`packages/server/src/replay-logging.ts` used `createReplayFilename(record: ReplayActionRecord, ...)` while the sink stream initialization path (`NdjsonReplaySink.ensureStream`) is fed by generic replay records (`ReplayRecord`). This mismatch is narrower than the actual replay contract and can reject valid non-action records at type level.

## Decision

Widen `createReplayFilename` input type from `ReplayActionRecord` to `ReplayRecord`.

## Rationale

- Filename derivation only reads `record.matchId` and `record.seed`, both available on replay records used by server logging.
- The server sink contract is record-agnostic (`writeRecord(record: ReplayRecord)`), so helper typing should match this boundary.
- This is a type-level alignment only; runtime filename logic remains unchanged.

## Consequences

- `NdjsonReplaySink.ensureStream` can call `createReplayFilename(record)` for both action and system records without casts.
- No replay payload schema changes.
- No gameplay/rules behavior changes.
