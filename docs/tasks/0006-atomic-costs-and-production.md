# Task 0006 - Atomic Cost Resolution + Production Tie Split

## Goal
Restore "atomic" rule execution:
- costs must be validated before committing any mutations
- no partial pays
- production: implement tie-split and remainder -> Noise

## Inputs
- current pay atom allows partial pay
- production tie split is missing

## Outputs
- Cost resolution helper:
  - validateCost(G, ctx, costSpec) -> ok | error
  - commitCost(G, ctx, costSpec)
- Modify resolver so effects are:
  - validate phase (dry-run)
  - commit phase (apply)
- Implement production tie-split per rules (even split, remainder to Noise)

## Constraints
- No rebalance, no interpretation changes.
- Determinism must be preserved.

## Invariants
- If cost cannot be paid, state remains unchanged.

## Acceptance
- Unit tests prove:
  - insufficient resources -> no mutation
  - tie in majority -> split production + remainder to Noise

## PR Checklist (fill at end)
- [x] No partial pays remain
- [x] Two-phase (validate/commit) implemented for costs
- [x] Production tie-split implemented
- [x] Added/updated tests
- [x] Updated CHANGELOG.md (Unreleased)
- [x] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Made cost resolution atomic and implemented production tie-splitting.
