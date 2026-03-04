# DD-0331 — Emit settlement replay records after deterministic settlement mutations

- **Date:** 2026-03-04
- **Status:** Accepted
- **Task:** 0331

## Context

`system.roundSettlement` replay records include optional `stateHash` (`hashState(context.G)`). Emitting the record before all deterministic settlement mutations complete can produce hashes that do not match the fully settled state used by replay verifiers and downstream audit tooling.

The affected flows are:

- Regular settlement (`turn.onEnd`) after last player turn.
- Auto-final settlement (`turn.onBegin`) when draw/end conditions trigger end-of-game settlement.

## Decision

Emit `system.roundSettlement` replay records only after deterministic settlement mutations on `G` are complete in each path.

- **Regular settlement:** emit after production resolution, `onRoundEnd` hooks, round-scoped usage reset, and round-settlement flags.
- **Final settlement:** emit after `roundSettlementDone` and deterministic end-condition `G` mutations.

`stateHash` remains `hashState(context.G)`; callsites now provide post-mutation context.

## Rationale

- Keeps replay `stateHash` aligned with verifier expectations (`verifyCheckpoints`) for post-settlement checkpoints.
- Preserves determinism contract by hashing the canonical post-settlement `G` state.
- Avoids introducing alternate hash semantics (e.g., pre-settlement snapshots) that would diverge from current verifier model.

## Consequences

- Replay `system.roundSettlement` records represent fully settled `G` snapshots.
- Verifier diagnostics now explicitly call out expected **post-settlement** hash semantics.
- New tests cover both `settlementKind: 'regular'` and `'final'` with `includeStateHash: true` and checkpoint verification enabled.
