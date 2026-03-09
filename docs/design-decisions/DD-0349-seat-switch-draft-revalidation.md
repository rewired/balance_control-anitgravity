# DD-0349 — Seat-switch draft revalidation without auto-clear

- Status: Accepted
- Date: 2026-03-09
- Deciders: Client-web maintainers
- Related task: 0349

## Context

ARCH-06 E2E contract requires that a draft can become invalid after hotseat seat switch and Confirm must be disabled without auto-commit. The prior controller behavior cleared transient draft state on `myPid` change, so invalidation behavior could not be observed and the user lost draft context on seat switch.

## Decision

1. Preserve `proposedIntent` and draft key across seat changes.
2. Recompute legality from engine-authoritative legal intents (`vm.intents`) for the currently active seat.
3. Disable confirm and hard-gate `confirmDraft` when the mounted draft is not legal now.
4. Do not dispatch any move on seat switch.

## Consequences

- Positive: Seat-switch behavior now aligns with ARCH-06 contract for explicit confirm + invalid draft state.
- Positive: No client-side rules duplication; legality remains a projection over engine legal intents.
- Trade-off: Users may see stale draft summary after switching seats, but it is clearly non-confirmable until edited/cancelled.
