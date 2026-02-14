# Task 0002 - Deterministic IDs + RNG Policy

## Goal
Eliminate all nondeterministic sources:
- replace Date.now / Math.random usage in game state, resolver, measures, expansions
- introduce a deterministic ID allocator in G (monotonic counter)
- enforce seeded RNG via ctx.random (or equivalent boardgame.io mechanism)

## Inputs
- codebase grep targets:
  - Date.now(
  - Math.random(
- boardgame.io ctx.random is the intended deterministic RNG surface

## Outputs
- G.engine.idSeq (number) and helper allocId(prefix): string
- Replace every nondeterministic ID creation with allocId(...)
- Replace any random selection/shuffle with ctx.random.* or deterministic shuffle using ctx RNG
- Add lint/guard:
  - a unit test or grep-based test that fails if Date.now/Math.random appear in packages/game, packages/expansion-*, packages/rules

## Constraints
- No mechanic changes: only "how" IDs/random are produced.
- All IDs must be stable under replay with same seed.
- Do not store functions/Date objects in state.

## Invariants
- State remains serializable.
- Replays remain stable.

## Acceptance
- Ripgrep shows zero matches for Date.now/Math.random in gameplay packages
- A deterministic replay run produces identical state hashes (hashing can be stubbed until Task 0010, but at least snapshot equality tests exist)

## PR Checklist (fill at end)
- [x] Added deterministic allocId in G and used everywhere
- [x] Removed Date.now / Math.random from gameplay
- [x] Added guard test for forbidden APIs
- [x] Updated CHANGELOG.md (Unreleased)
- [x] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Replaced nondeterministic ID/RNG sources with deterministic allocId and ctx RNG.
