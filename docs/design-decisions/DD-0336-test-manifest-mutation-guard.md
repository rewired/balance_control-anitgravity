# DD-0336 — Guard RULESET_MANIFEST mutation tests against leak on assignment failure

- **Date:** 2026-03-08
- **Status:** Accepted
- **Task:** 0336

## Context

`packages/game/test/setup.test.ts` includes a regression test that mutates `RULESET_MANIFEST` to verify that setup metadata is sourced from the shared rules package manifest.

Because `@balance-control/game` tests run in a single process (`--no-threads`), any leaked mutation can affect other tests that read the manifest.

Previously, assignment into `RULESET_MANIFEST` happened before the `try/finally` restore block. If a future refactor made either manifest field non-writable, an assignment exception could skip restore and leak partially-mutated state.

## Decision

1. Introduce a local helper in `setup.test.ts` that captures prior manifest values, performs mutation **inside** a `try/finally`, runs the assertion callback, and always restores prior values.
2. Enable Vitest per-file isolation for the game package test script (`--isolate true`) while keeping `--no-threads`, reducing cross-file module-state coupling in this package.

## Consequences

- Manifest override tests become resilient to assignment-time failure and always attempt restoration.
- Existing deterministic test behavior remains unchanged.
- Test process remains single-threaded but has stronger file isolation defaults.

## Guardrails

- Affected guardrails: **NONE** (test harness hardening only; no runtime rules/state behavior change).
