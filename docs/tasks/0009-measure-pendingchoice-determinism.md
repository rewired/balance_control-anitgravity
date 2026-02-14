# Task 0009 - Measure CPU: PendingChoice Determinism + Serialization

## Goal
Make PendingChoice safe for network play and replays:
- pending choice tokens must be deterministic (allocId)
- pending queue/stack must be fully serializable and stable
- ensure "pause/resume" does not leak nondeterminism

## Inputs
- current resumeToken uses Math.random
- history uses Date.now

## Outputs
- PendingChoice.id allocated via allocId("choice")
- History entries use monotonic counters, not timestamps
- Add tests: same seed + same move sequence -> same pending choice ids + same state snapshot

## Constraints
- Do not implement new measure effects. Only determinism + plumbing.

## Invariants
- Resume always continues from exact same resolver position.

## Acceptance
- Deterministic replay with pending choices produces identical state

## PR Checklist (fill at end)
- [x] PendingChoice IDs deterministic
- [x] No timestamps in state/history
- [x] Tests added
- [x] Updated CHANGELOG.md (Unreleased)
- [x] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Made PendingChoice/Measure execution deterministic and replay-stable.
