# Task 0008 - Expansion Gating + Setup Shuffle Order + Isolation

## Goal
Make expansions optional, isolated, and setup-correct:
- add expansion flags to game config
- registry only applies enabled expansions
- expansion tiles must be added before final shuffle
- core must not hardcode expansion zones/resources

## Inputs
- expansions currently always registered
- setup shuffles before expansion injection
- some core zone names include expansion details

## Outputs
- GameConfig expansion flags (ex01/ex02/ex03 booleans)
- ExpansionRegistry.applySetup(G, ctx, config) runs before final shuffle
- Cleanup: expansion-specific zone names removed from core lists (moved behind flags)
- Tests: enabled vs disabled expansions produce different deterministic deck composition

## Constraints
- No new expansion mechanics, only wiring + isolation.
- Deterministic.

## Invariants
- Core-only game remains playable and deterministic.

## Acceptance
- Core-only setup does not include expansion tiles
- ex01 enabled setup includes tiles and remains deterministic

## PR Checklist (fill at end)
- [ ] Added expansion flags + gating
- [ ] Setup ordering fixed (inject then shuffle)
- [ ] Core isolation improved (no expansion hardcoding)
- [ ] Tests updated
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Added expansion gating and fixed setup shuffle order for deterministic composition.
