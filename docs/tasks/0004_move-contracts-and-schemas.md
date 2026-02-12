# Task 0004 - Move Contracts Normalization (Payloads + Validation)

## Goal
Stop signature drift between UI/tests/engine:
- define canonical Move payload types (and Zod schemas where applicable)
- update client + tests to call moves with correct payloads
- reject malformed moves early with clear errors

## Inputs
- current client calls moves without payload
- tests use outdated signatures

## Outputs
- In packages/rules or packages/game: MovePayload types + Zod schemas
- In packages/game: moves validate payload via schema (or strict runtime checks)
- Update packages/client-web and tests to use canonical payloads

## Constraints
- No rule changes.
- Moves must remain deterministic and serializable.

## Invariants
- Illegal moves return INVALID_MOVE and do not mutate state.

## Acceptance
- Client can execute the basic flow without crashing due to payload mismatch
- Test suite updated to match new signatures (even if not yet fully passing until later tasks)

## PR Checklist (fill at end)
- [ ] Canonical payload types defined
- [ ] Runtime validation added
- [ ] Client updated
- [ ] Tests updated
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Normalized move payload contracts and added runtime validation.
