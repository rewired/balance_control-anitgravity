# DD-0260 — Game Test Isolation & EnginePackRegistry Reset Discipline

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0260

## Context

`packages/game` tests use a process-global `EnginePackRegistry` singleton and mutable in-memory harness state (`G`, `ctx`). Two stability hazards were observed:

1. intra-test state leakage in looped assertions (`moves.test.ts`) where one move variant mutated shared harness state used by later variants;
2. suite-level singleton carry-over risk when packs are not explicitly cleared after test execution.

## Decision

Adopt explicit isolation discipline for game tests:

1. **Per-case harness reset for table-driven checks.**
   - Rebuild `G`, `ctx`, and events before each variant execution in a looped test.
2. **Suite-level singleton teardown.**
   - Add `afterEach` cleanup (`EnginePackRegistry.clear()`) in suites that register packs (`moves.test.ts`, `turn.test.ts`).
3. **Endgame test flow uses deterministic forced turn completion.**
   - For draw-pile-immediate-end tests, use `client.events.endTurn()` after `placeTile` to deterministically reach settlement in single-player harness cases.

## Consequences

- Tests become order-independent within suite and across suites.
- Global registry state no longer leaks into subsequent test files.
- Endgame assertions remain deterministic under current turn/stage gates.

## Alternatives Considered

- Global Vitest setup that clears `EnginePackRegistry` for all suites.
  - Rejected for now: broader blast radius and less local clarity than explicit suite teardown.
- Rewriting all tests to avoid the singleton helper.
  - Rejected: too broad for this task.
