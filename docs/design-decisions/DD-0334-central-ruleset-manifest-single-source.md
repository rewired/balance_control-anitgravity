# DD-0334 — Centralize SetupGame ruleset manifest source

- **Date:** 2026-03-08
- **Status:** Accepted
- **Task:** 0334

## Context

`packages/game/src/setup.ts` maintained a local fallback literal for ruleset metadata (`coreVersion`, expansion versions, `specAnchorHash`) alongside `RULESET_MANIFEST` from `@balance-control/rules`. This duplicated canonical metadata and allowed silent drift between packages.

## Decision

Use `RULESET_MANIFEST` directly as the setup manifest source and remove the hardcoded literal fallback from `SetupGame`.

Add a regression test that overrides central manifest values and asserts `SetupGame().meta.ruleset` reflects those values, proving setup is bound to the shared export instead of local literals.

## Rationale

- Preserves a single source of truth for ruleset metadata across packages.
- Reduces drift risk between `rules` and `game` packages.
- Maintains existing behavior where setup metadata includes only enabled expansion versions.

## Consequences

- Setup metadata now directly tracks the central manifest export.
- Future manifest updates in `@balance-control/rules` automatically propagate to setup metadata.
- Test coverage will catch regressions that reintroduce local literal duplication.
