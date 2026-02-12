# Task 0013 - Influence Cap Enforcement: Apply Only On Creation (Not Move/Place)

## Goal
Fix incorrect Influence cap enforcement that blocks legal play.
Cap checks must apply only when a new Influence marker is created, not when one is moved or placed.

## Inputs
- placeInfluence and moveInfluence currently check the per-player cap via countPlayerInfluence(...).
- This is incorrect because moving/placing does not create new influence markers, it only relocates them.
- The cap should apply to creation actions (e.g., formalizeInfluence or any other effect that creates new markers).

## Outputs
- Remove cap checks from:
  - placeInfluence
  - moveInfluence
- Apply cap checks only to Influence creation paths, e.g.:
  - formalizeInfluence
  - any atom/effect that creates new Influence markers
- Add targeted tests:
  - When player already at cap:
    - moveInfluence is legal and mutates state correctly
    - placeInfluence is legal if it uses an existing marker from supply / relocation (as per current model)
    - formalizeInfluence is rejected if it would create a new marker beyond the cap
- Ensure all failures are atomic (no partial mutation).

## Constraints
- No rule changes. This is a legality fix.
- Deterministic only.
- Keep changes minimal.

## Invariants
- Illegal moves do not mutate state.
- Cap value remains unchanged (do not rebalance).

## Acceptance
- Tests demonstrate:
  - moving influence at cap is allowed
  - creating new influence at cap is rejected
- docs/PR_TASK_LIST.md: Task 0013 is checked.
- CHANGELOG.md updated under Unreleased.

## PR Checklist (fill at end)
- [x] Removed cap checks from move/placement paths
- [x] Enforced cap only on creation paths
- [x] Added tests for cap behavior (move allowed, create rejected)
- [x] Updated CHANGELOG.md (Unreleased)
- [x] Updated docs/PR_TASK_LIST.md (checked Task 0013)
- [x] No unrelated refactors

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Corrected Influence cap enforcement to apply only to marker creation, not relocation.
