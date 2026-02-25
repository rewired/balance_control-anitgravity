# DD-0266 — Root move surface restricted to systemic actions

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0266

## Context

`createBalanceControlGame()` exposed the full merged move map at root (`moves: mergedMoves`).
That made stage-bound political moves (`placeInfluence`, `moveInfluence`, `formalizeInfluence`, `convertResources`) reachable through root move wiring instead of being constrained to `turn.stages.politicalAction.moves`.

This weakens stage-boundary clarity and allows accidental client/API assumptions that political actions are globally callable.

## Decision

1. Define a dedicated root/system move list and expose only those moves at root.
2. Keep `resolveChoice` as the sole root move for pending-choice/system resolution.
3. Keep political actions exclusively in `turn.stages.politicalAction.moves`.
4. Keep expansion political move modules stage-scoped in `politicalAction` as well.

## Consequences

- Root move API surface is narrower and reflects the stage contract.
- Political actions are no longer directly exposed via root move map.
- Tests must assert stage-scoped move exposure and root/system separation.
- Pending-choice handling remains available through root `resolveChoice`.
