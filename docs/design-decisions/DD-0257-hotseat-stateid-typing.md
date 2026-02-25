# DD-0257 — Hotseat snapshot stateID typing boundary

## Status
Accepted — 2026-02-25

## Context
`packages/client-web/src/hotseat/HotseatShell.tsx` exposes optional E2E hooks. The `getStateID` hook previously read `ctx._stateID` and `ctx.stateID` directly. Under strict TypeScript, boardgame.io `Ctx` does not define those properties, causing `pnpm -w build` to fail with TS2339.

## Decision
Introduce a local typed adapter (`StateIDCarrier` + `readStateID`) that treats stateID fields as optional snapshot metadata and reads them without extending boardgame.io core `Ctx` types.

## Consequences
- Build is restored without using `any` on the `ctx` object shape.
- Client remains presentation/testing-only and does not alter engine semantics.
- Future boardgame.io shape changes are isolated to one helper function in `HotseatShell`.
