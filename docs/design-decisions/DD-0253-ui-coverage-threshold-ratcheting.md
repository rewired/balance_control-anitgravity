# DD-0253 — UI Coverage Threshold Ratcheting Policy

**Date:** 2026-02-25
**Status:** Accepted
**Task:** `0253-ui-coverage-threshold-policy`

## Context

The UI package (`packages/client-web`) had test execution but no enforceable coverage floor. This allowed regressions in test depth to pass unnoticed and made quality gates inconsistent across local and root-level QA flows.

## Decision

1. Enforce `test.coverage` in `packages/client-web/vite.config.ts` with:
   * provider: `v8`
   * reporters: `text`, `lcov`
2. Set initial realistic minimum thresholds:
   * branches `45`
   * functions `55`
   * lines `60`
   * statements `60`
3. Add `test:coverage` to `packages/client-web/package.json`.
4. Bind coverage to root QA by adding root script `test:ui:coverage` and making `test:ui:all` run coverage before UI E2E.
5. Publish a binding team policy in `docs/qa/ui-coverage-threshold-policy.md`, including ratcheting rules and no-decrease default.

## Consequences

* Positive:
  * UI coverage becomes enforceable and visible in local/CI flows.
  * `lcov` output supports downstream quality tools.
  * Ratcheting policy prevents silent quality erosion.
* Trade-offs:
  * Coverage runs are slower than plain unit test runs.
  * Threshold tuning may require periodic updates as codebase shape changes.

## Compliance Notes

* No engine/gameplay behavior changes.
* No client-side rules execution added.
* Policy and tooling changes remain within UI/testing boundaries.
