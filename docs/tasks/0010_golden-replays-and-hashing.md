# Task 0010 - Golden Replays + State Hashing Harness

## Goal
Create a deterministic regression harness:
- run a scripted sequence of moves
- snapshot final G + a stable hash
- store fixtures as "golden" and fail on drift

## Inputs
- determinism and atomicity fixes from tasks 0002-0009

## Outputs
- /packages/game/test/golden/*.json (seed, config, move list, expected final hash)
- hashState(G): stable hash over canonical JSON (sorted keys)
- CI test that replays goldens and asserts hash match

## Constraints
- Hash must be stable across node versions as far as practical (canonical JSON, sorted keys).
- No dependence on wall clock.

## Invariants
- Goldens only change when rules change (and rules should not change in this phase).

## Acceptance
- "pnpm -r test" includes golden replay suite
- At least 2 goldens:
  - core-only 3 players, 2 rounds
  - core + ex01 enabled small scenario

## PR Checklist (fill at end)
- [ ] Added canonical hashing
- [ ] Added golden replay fixtures
- [ ] Tests pass locally
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Added golden replay + state hashing harness to prevent rule drift.
