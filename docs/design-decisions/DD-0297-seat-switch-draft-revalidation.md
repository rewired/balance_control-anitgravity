# DD-0297 — Seat-switch draft revalidation visibility in ARCH-06

- **Date:** 2026-02-26
- **Status:** Accepted
- **Task:** 0297

## Context

ARCH-06 already enforced explicit draft confirmation and no auto-commit, and tests proved confirm becomes disabled for illegal drafts. The interaction contract did not explicitly state what happens when hotseat `playerID`/seat changes while a draft exists.

## Decision

Codify the behavior in ARCH-06 Interaction Model:

- On `playerID`/seat switch, an existing draft is immediately revalidated against the new seat context.
- If draft is not legal for the new seat context, Confirm must be disabled.

To make E2E assertions deterministic, expose the current draft key as a non-visual test hook (`data-testid="draft-key"`) within ActionDock's draft panel.

## Consequences

- Contract language now directly describes seat-switch behavior expected by tests.
- E2E can assert draft identity pre/post switch without relying on brittle text extraction.
- No engine authority shift: legality remains derived from engine-enumerated intents; UI only reflects `draft.isLegalNow`.
