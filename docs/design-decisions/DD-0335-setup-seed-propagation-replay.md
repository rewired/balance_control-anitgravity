# DD-0335 — Persist setup seed in engine state for replay parity

- **Date:** 2026-03-08
- **Status:** Accepted
- **Task:** 0335

## Context

Replay records and replay filenames already carry an optional `seed` field, but setup did not explicitly persist the effective boardgame.io match seed in engine state. This allowed readers to rely on legacy fallback paths and made seed provenance less explicit across server logging, verifier flows, and replay runner tooling.

## Decision

Persist the effective boardgame.io setup seed at game initialization in `G.engine.attributes.seed`.

Treat replay seed resolution as reader-only by consuming `G.engine.attributes.seed` and removing legacy fallback reads from `G.engine.seed`.

Add regression tests that verify:

- setup stores seed in engine attributes,
- replay action/system records include the seed field,
- replay filename generation includes the record seed segment.

## Rationale

- Keeps deterministic run metadata in authoritative engine state.
- Aligns server logger, verifier, and replay runner on one seed location.
- Prevents silent fallback behavior that can hide seed propagation bugs.

## Consequences

- Seed provenance is explicit and stable in serialized game state.
- Replay record seed availability now depends on setup seed propagation correctness (guarded by tests).
- Legacy `G.engine.seed` readers are intentionally unsupported for replay metadata.
