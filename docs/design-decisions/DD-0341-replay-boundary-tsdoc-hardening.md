# DD-0341 — Replay Boundary TSDoc Hardening

- **Status:** Accepted
- **Date:** 2026-03-08
- **Task:** 0341

## Context

`packages/game/src/engine/replay-sink.ts` exports replay record and sink types consumed across the engine/server boundary. These exported contracts lacked explicit TSDoc semantics for optional replay metadata fields (`matchConfig`, `expansions`) and did not consistently state deterministic contract expectations.

## Decision

Add explicit TSDoc blocks to the boundary exports:

- `ReplayActionRecord`
- `ReplaySystemRoundSettlementRecord`
- `ReplayCheckpointRecord`
- `ReplaySink`

The docs define that:

1. `matchConfig` and `expansions` are optional on body records.
2. When present on body records, they are metadata echoes and must remain semantically identical to replay header metadata.
3. `expansions` remains canonicalized (stable order, no duplicates).

Tags are added per ARCH-05 documentation contract for determinism and semantics (`@remarks`, `@deterministic`, and `@pure`/`@sideEffects`).

## Consequences

- No runtime behavior changes.
- Stronger API contract clarity for downstream server replay sinks and replay consumers.
- Lower risk of drift between replay header metadata semantics and optional body-level metadata echoes.
