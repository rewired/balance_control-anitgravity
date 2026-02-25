# DD-0262 — Fail-Fast Core Pack Preconditions in Game Test Harness

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0260 (amendment)

## Context

`packages/game` tests rely on the process-global `EnginePackRegistry`. When the `core` pack is not registered as expected (or registered without moves), downstream resolver/move tests can fail with indirect symptoms, slowing diagnosis.

## Decision

1. Add a **hard precondition** to `registerTestPacks()`:
   - Immediately after registering `core`, verify the registry contains `core` and that `core.moves` is non-empty.
   - Throw a clear error if the precondition fails.
2. Add a **local precondition assertion** in `moves.test.ts` before resolver-driven `moveInfluence` flow to surface registry misconfiguration directly at test entry.
3. Standardize additional registry-focused suites to symmetric `beforeEach` + `afterEach` lifecycle cleanup (`EnginePackRegistry.clear()`), reducing cross-file state leakage risk.

## Consequences

- Misconfigured test harness state is reported early and explicitly.
- Resolver-path failures become easier to triage.
- Registry lifecycle discipline is more uniform across test suites.

## Alternatives Considered

- Global Vitest hook for all registry cleanup.
  - Deferred: explicit suite-local lifecycle remains easier to audit while the test matrix is still being hardened incrementally.
