# Task 0005 - Turn Flow: Exactly-One Political Action + Usage Reset

## Goal
Make turns playable and rule-consistent:
- ensure stage "politicalAction" only allows political actions (no placeTile there)
- enforce exactly one political action per turn
- reset per-turn usage correctly (turn end, round transitions)

## Inputs
- current stage merges CoreMoves including placeTile
- usage increments incorrectly, and is not reset reliably

## Outputs
- Move gating per stage (only allowed moves in each stage)
- Clear turn pipeline:
  - draw tile (if applicable)
  - place tile (exactly once)
  - political action (exactly one)
  - end turn
- Usage reset in the right lifecycle hook(s)

## Constraints
- No new mechanics. Only enforce the intended flow.
- Deterministic only.

## Invariants
- If a move is not legal in the current stage, it must be rejected without mutation.

## Acceptance
- A 3-player hotseat can complete 2 full rounds without softlocking
- No placeTile callable during politicalAction stage

## PR Checklist (fill at end)
- [ ] Stage move lists are strict
- [ ] Exactly-one political action enforced
- [ ] Usage reset implemented
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed turn stage gating and per-turn usage reset to prevent softlocks.
