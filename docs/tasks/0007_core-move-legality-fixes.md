# Task 0007 - Core Move Legality Fixes (Influence + Formalize + Convert)

## Goal
Fix the most visible rule drift in core moves:
- placeInfluence: allowed on valid Board tiles (not only Lobbyist)
- moveInfluence: target must be a Board tile
- formalizeInfluence: enforce correct costs and timing restrictions
- convertResources: implement per Grassroots definition (no weird atom chaining)

## Inputs
- current drift: placeInfluence restricted incorrectly
- formalize costs not enforced
- convertResources calls unrelated atoms

## Outputs
- Correct legality checks + errors
- Correct cost specs:
  - Standard Committee: 2 resources of different types
  - Start Committee: special cost (per rules)
- ConvertResources implemented as per rule text
- Tests covering these cases

## Constraints
- Core freeze: do not add mechanics.
- Keep UI changes minimal (payload already normalized in Task 0004).

## Invariants
- Illegal moves do not mutate state.

## Acceptance
- Legal placeInfluence works on non-Lobbyist tiles
- Illegal targets are rejected
- Formalize cost rules enforced with atomic rollback

## PR Checklist (fill at end)
- [ ] placeInfluence legality fixed
- [ ] moveInfluence board-only validation fixed
- [ ] formalizeInfluence cost/timing enforced
- [ ] convertResources implemented correctly
- [ ] Updated tests
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed core move legality (Influence placement/move, formalize costs, resource conversion).
