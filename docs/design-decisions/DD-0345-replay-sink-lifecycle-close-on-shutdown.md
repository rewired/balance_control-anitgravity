# DD-0345 — Closeable replay sink lifecycle and single-shot shutdown finalization

- Status: Accepted
- Date: 2026-03-08
- Deciders: Engine/Server maintainers
- Related: `packages/game/src/engine/replay-sink.ts`, `packages/server/src/replay-logging.ts`, `packages/server/src/index.ts`, Task 0345

## Context

Replay footer emission is performed by sink finalization (`close()`), but `ReplaySink` previously modeled only `writeRecord`, and server shutdown paths did not centrally guarantee one-time sink finalization.

This left footer emission correctness dependent on ad-hoc caller behavior and made process signal handling vulnerable to duplicate or missing close calls.

## Decision

1. Extend `ReplaySink` with an optional lifecycle hook `close?(): void | Promise<void>` and document that footer-capable sinks must finalize terminal records during close.
2. Narrow server replay sink typing (`createReplaySink`) to return a closeable sink contract so runtime callers can invoke `close` safely.
3. Centralize server process shutdown registration in a dedicated lifecycle helper that hooks `SIGINT`, `SIGTERM`, `beforeExit`, and `exit` and enforces single-shot `close()` execution.

## Consequences

- Replay footer emission is now explicit lifecycle behavior in shared typing.
- Main server and hotseat ingest paths share one sink instance with one shutdown/finalization contract.
- Signal and exit shutdown paths cannot emit duplicate footer finalization for the same process lifetime.
