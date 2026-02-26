# DD-0296 — PendingChoice resolveChoice postcondition and hard-gate flow proof

- **Date:** 2026-02-26
- **Status:** Accepted
- **Related task:** 0296
- **Scope:** `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`, `packages/client-web/test/pending-choice-hardgate.test.tsx`

## Context

ARCH-06 defines the Pending Choice hard-gate but did not state an explicit postcondition for the `resolveChoice` dispatch outcome. This made it harder to assert the exact transition out of hard-gate mode in tests and review.

## Decision

1. Extend ARCH-06 Section 5 (`Pending Choice (Hard Gate)`) with an explicit postcondition:
   - after successful `resolveChoice` dispatch, `G.engine.pendingChoice` must be `null`/`undefined` in the next state.
2. Add a regression test that proves complete selectTile hard-gate exit behavior:
   - expected `resolveChoice` intent is dispatched,
   - pending overlay is absent in follow-up state,
   - board click returns to normal inspect flow.
3. Add regression coverage for resolveChoice dispatch failure path:
   - user receives a visible `dispatch.rejected` notice.

## Consequences

- Reviewers and implementers now have an unambiguous state-transition requirement at the ARCH-06 contract level.
- UI test coverage now asserts both successful hard-gate exit and user-visible failure feedback.
- No engine-rule semantics are changed; this is contract clarification + client-side regression coverage.
