# DD-0325 — Board viewport unit test alignment for `setTransform` animation argument

## Status
Accepted — 2026-03-04

## Context
`packages/client-web` tests were failing in `test/board-viewport.test.tsx` because assertions expected `setTransform(x, y, scale)` while runtime `BoardViewport` currently calls `setTransform(x, y, scale, animationTime)` with `animationTime=200` for non-E2E environments.

This mismatch is test-only drift and does not indicate a runtime bug.

## Decision
Align tests with runtime call contract:

1. Update mock typing to accept optional 4th argument (`animationTime`).
2. Assert `setTransform` is called with all runtime arguments, including `200`.

## Consequences

### Positive
* Restores `pnpm -C packages/client-web test` stability without altering production behavior.
* Encodes current viewport transition contract in unit assertions.

### Negative / Trade-offs
* Assertions now encode a concrete default animation duration (`200`) and would need updates if the runtime constant changes intentionally.

## Alternatives Considered

1. **Change runtime back to 3-argument calls**.
   Rejected because runtime supports animation and existing component behavior is intentional.
2. **Use loose matcher (`toHaveBeenCalled`) without argument checks**.
   Rejected because it weakens regression protection for viewport transform semantics.
