# Task 0014 - Grassroots Conversion Data: Make ConvertResources Work In Real Games

## Goal
Ensure ConvertResources works in actual matches with generated core tiles.
Currently, Grassroots tiles produced by SetupGame lack conversion data, causing convertResources to be unusable.

## Inputs
- convertResources expects Grassroots tiles to include a conversion spec (tile.conversion).
- SetupGame.generateCoreTiles creates Grassroots tiles without conversion spec.
- Tests currently fake Grassroots tiles with conversion spec, masking the real issue.

## Outputs
Implement a rules-faithful solution WITHOUT inventing new mechanics:
- Preferred approach: Make convertResources depend on tile type (Grassroots) rather than per-instance conversion spec.
  - If the active tile is Grassroots, allow conversion per CORE rule definition.
  - Conversion parameters are chosen by the player via move payload (inputs + output type), validated by rules.
- Alternate approach: Add a minimal, generic conversion metadata to all generated Grassroots tiles:
  - inputSlots = 2
  - outputSlots = 1
  - Do not encode output resort in tile data (still chosen at runtime by move payload).
Pick ONE approach and keep it consistent across engine, resolver, and tests.

Also:
- Update core tile generation so real games can use convertResources on Grassroots.
- Add tests that run against the real SetupGame-generated Grassroots tile:
  - convertResources succeeds with valid inputs and outputs
  - fails atomically with invalid inputs/costs
- Remove any test-only hacks that create special Grassroots tiles not matching real setup.

## Constraints
- Core freeze: do not add new mechanics or rebalance conversion.
- Deterministic only.
- Keep changes minimal and localized to conversion + tile gen + tests.

## Invariants
- Illegal conversions do not mutate state.
- Costs remain atomic (validate then commit).

## Acceptance
- In a normal setup game, drawing/placing a Grassroots tile allows convertResources to be executed legally.
- Tests cover success + failure paths using real generated tiles.
- docs/PR_TASK_LIST.md: Task 0014 is checked.
- CHANGELOG.md updated under Unreleased.

## PR Checklist (fill at end)
- [ ] ConvertResources works on real setup-generated Grassroots tiles
- [ ] Removed reliance on per-instance conversion data or added generic metadata (one consistent approach)
- [ ] Added tests using real SetupGame tile generation
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md (checked Task 0014)
- [ ] No rule changes / no rebalance

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed Grassroots conversion plumbing so ConvertResources works in real matches.
