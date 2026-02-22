# Codex Task 0151 - UI: Formalize Influence Wizard

The `formalizeInfluence` move is complex because it can involve multiple legal combinations of a committee tile and one or more resource tokens used as payment. To avoid overwhelming the user with a long list of intents, we need a guided interaction (wizard) that lets the user first select a committee and then choose the payment combination.

## Status
- [x] DRAFT
- [x] FROZEN
- [x] IMPLEMENTING
- [x] VERIFYING
- [x] COMMIT_READY
- [x] DONE

## Summary
- Implemented `formalizeInfluence` interaction mode in `InteractionController`.
- Added `formalizeHelpers.ts` for grouping and sorting intents by committee and payment.
- Created `FormalizeWizardModal` for a two-step selection process:
    1. Select Committee (tile).
    2. Select Payment (resource combinations).
- Integrated wizard with `ActionDock`, `HexBoard`, and `ModalHost`.
- Updated `MoveConfirmationModal` to show formalize-specific details.
- Verified with unit tests and E2E visual check (button presence).
- Regenerated spec anchors to resolve engine test failures.

## Verification Results
- `pnpm -C packages/client-web test`: All tests passed (including new wizard tests).
- `pnpm -C packages/game test`: All tests passed (including tripwire fix).
- `pnpm build`: Successful build of all packages.
- Frontend: "Formalize Influence" button appears in Political Action phase (verified via screenshot).
