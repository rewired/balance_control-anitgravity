# Task 0012 - Prevent Softlock When DrawPile Is Empty Mid-Round

## Goal
Prevent turn-stage softlocks when a player cannot draw/place a tile because DrawPile is empty.
The game must remain playable until the end-of-round settlement that ends the game.

## Inputs
- Current flow uses a draw-and-place stage that only allows placeTile.
- If DrawPile is empty, drawTileToStaging does nothing, placeTile becomes INVALID_MOVE,
  and the stage has no legal moves (softlock).
- Rules intent: game ends after settlement of the round in which DrawPile becomes empty.

## Outputs
- Add a deterministic, rules-consistent escape hatch for the draw-and-place stage:
  - Option A (preferred): a move passTilePlacement that is legal ONLY if there is no staging tile.
  - Option B: auto-skip from drawAndPlace to politicalAction when staging tile is empty.
- Ensure that even without placing a tile, the player can proceed to their political action stage (if rules allow),
  or can end the turn in a deterministic way.
- Add tests that force DrawPile to empty mid-round and prove:
  - no softlock
  - round finishes
  - end-of-round settlement runs
  - endGame triggers only after the round settlement (not immediately on empty draw)

## Constraints
- No new mechanics. This is a legality / flow fix to match rules intent.
- Deterministic only (no time, no randomness beyond ctx.random where already used).
- Minimal diffs outside of turn/stage logic and tests.

## Invariants
- If a move is illegal in the current stage, it must not mutate state.
- The game end condition remains "after settlement of the round in which DrawPile becomes empty".

## Acceptance
- Scenario test: 2-3 players, tiny DrawPile, empties mid-round:
  - the active player does not get stuck in drawAndPlace
  - the game can progress to end-of-round
  - endGame occurs after settlement, not earlier
- docs/PR_TASK_LIST.md: Task 0012 is checked.
- CHANGELOG.md updated under Unreleased.

## PR Checklist (fill at end)
- [x] Implemented pass/skip behavior for empty staging tile (no softlocks)
- [x] Added deterministic tests for empty DrawPile mid-round
- [x] Verified endGame timing remains end-of-round settlement
- [x] Updated CHANGELOG.md (Unreleased)
- [x] Updated docs/PR_TASK_LIST.md (checked Task 0012)
- [x] No rule changes / no rebalance

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed draw-stage softlock when DrawPile is empty; end-of-round completion remains intact.
