# DD-0313 — Engine Post-Move Replay Hook (best-effort, filesystem-free)

## Context

Replay v1 contracts currently define configuration and record format, but the engine had no single canonical post-move emission hook for runtime action logging. We need one integration point that records only successfully executed moves, keeps a monotone sequence number, can optionally add deterministic state hashes, and does not couple `packages/game` to filesystem concerns.

## Decision

1. Introduce a new engine-level infrastructure interface `ReplaySink` in `packages/game/src/engine/replay-sink.ts`.
2. Add `withReplaySink(moves, options)` that wraps move handlers and writes an action record **only when move execution does not return `INVALID_MOVE`**.
3. Maintain a monotone in-memory `seq` counter per game factory instance and attach it to each emitted record.
4. Support optional `stateHash` emission (`includeStateHash`) via the canonical `hashState` pipeline.
5. Enforce best-effort semantics: sink write failures are caught and forwarded to an explicit error channel (`onError`) without rethrowing.
6. Keep engine filesystem-free by requiring all output handling through the `ReplaySink` interface.

## Consequences

- A single hook point now exists at move-execution boundary in the game/engine path.
- Replay/action logging can be implemented by server/runtime adapters without introducing file I/O into engine code.
- Logging failures cannot alter move legality or resulting state transitions.
- Deterministic replay traces can include optional hashes while remaining configurable.
