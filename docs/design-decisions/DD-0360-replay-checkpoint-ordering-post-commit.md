# DD-0360 — Replay checkpoint ordering from post-commit authoritative snapshot

- **Date:** 2026-03-09
- **Status:** Accepted
- **Related Task:** 0360

## Context

Replay emission in the move pipeline was vulnerable to stale projection risk because action, hash, and checkpoint summary derivations were not explicitly bound to a single captured post-mutation snapshot. This creates potential one-tick drift hazards in future refactors, especially when additional replay projections are introduced.

## Decision

1. Introduce a canonical helper `projectReplayCheckpointSummary(G, ctx)` in replay sink infrastructure.
2. In move emission, capture authoritative post-move `G`/`ctx` once after move application.
3. Derive `postActionStateHash` and checkpoint `perPlayer/global` summaries from the same captured snapshot.
4. Add replay verifier checkpoint consistency assertions (when `verifyCheckpoints` is enabled):
   - recompute checkpoint summary from canonical client state;
   - assert exact `perPlayer` and `global` match.
5. Add non-production (or `BC_DETERMINISTIC_DEV_MODE=1`) debug guard logging that reports pre/post state object identity and state version to surface stale-read bugs early.

## Consequences

- Replay emission ordering is explicit and safer against race/lag regressions.
- Verifier now detects stale checkpoint payloads, not only hash mismatches.
- Additional debug logs appear in tests/dev by design; they remain disabled in production.

## Compliance

- **GR-001 (Engine State Authority):** uses authoritative engine state snapshot only.
- **GR-002 (Engine-only Rule Execution):** replay remains observational and engine-side.
- **GR-003 (Determinism Contract):** hash and projection derived deterministically from same snapshot.
