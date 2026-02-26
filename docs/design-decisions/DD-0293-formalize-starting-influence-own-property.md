# DD-0293 — Formalize starting-influence gate uses explicit own marker

## Context

`CORE-01-08-02` requires that all starting influence be placed before formalization.
The engine check in `allStartingInfluencePlaced` previously used a broad truthy check on `obj.isStarting`.
Under full-suite execution, inherited/prototype pollution can make non-starting influence appear as starting and cause false `INVALID_MOVE` results.

## Decision

Treat an influence as “starting” only when it has an explicit own property `isStarting === true`.

Implementation location:
- `packages/game/src/mechanics-turn.ts` (`allStartingInfluencePlaced`)

Regression evidence:
- `packages/game/test/new-core-settlement-endgame-obligations.test.ts`
  (`treats only explicit starting markers as gate blockers`)

## Consequences

- Preserves CORE timing-gate intent while avoiding inherited-property false positives.
- Keeps determinism and engine-only legality intact.
- No expansion/state-shape changes.
