# DD-0287 — ARCH-06 pending-choice selectTile E2E uses allowed tile targeting

## Status
Accepted — 2026-02-26

## Context
The second test in `e2e/client-web/arch06-pending-choice-hardgate.spec.ts` previously clicked `page.locator('[data-testid^="hex-tile-"]').first()` after injecting `pendingChoice.selectTile`.

That approach could accidentally click a tile that was not the tile explicitly allowed by `pendingChoice.spec.tileIds`, which weakens hard-gate proof quality and can hide regressions.

## Decision
For the `pendingChoice.selectTile` E2E flow:
1. Build a deterministic `tileId -> coord` mapping from `window.__BC_HOTSEAT_E2E_STATE__.G.grid`.
2. Select one concrete tileId from that controlled set (`Object.keys(...).sort()[0]`).
3. Inject `setPendingChoice({ kind: 'selectTile', spec: { tileIds: [tileId] } })` using that exact tileId.
4. Click `hex-tile-<coord>` for the mapped coord instead of `.first()`.

## Consequences
- The test now proves board interaction against an explicitly allowed tile, reducing false positives.
- Determinism is improved because both allowed tile selection and coordinate targeting are derived from a stable mapping.
- No engine rules or UI runtime behavior is changed; this is test-only hardening.
