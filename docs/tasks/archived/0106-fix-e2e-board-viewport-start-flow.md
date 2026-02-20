# Task: 0106-fix-e2e-board-viewport-start-flow

## Status: DONE

## Affected Guardrails
- NONE

## Problem
The E2E test `board-viewport.spec.ts` fails because it expects to land on the `lobby-screen` immediately, but a new "Start Screen" (mode selection) was introduced which now appears first.

## Proposed Solution
Update `e2e/client-web/board-viewport.spec.ts` to navigate directly to the online lobby mode using the `?mode=online` query parameter, or interact with the Start Screen to reach the lobby. Using the query parameter is preferred to keep the test focused on the viewport functionality.

## PR Checklist
- [x] pnpm lint passes
- [x] pnpm test passes
- [x] Determinism verified
- [x] No temporary files
- [x] Correct rule references included
- [x] Expansion isolation preserved
- [x] Bot validation tested (if touched)
- [x] Changelog updated

## Work Summary
- Updated `e2e/client-web/board-viewport.spec.ts` to navigate to `/?mode=online` to bypass the start screen.
- Fixed `packages/server/tsconfig.json` by adding `rootDir: "./src"` to ensure correct output directory structure for `dist/index.js`.
- Verified fix with `pnpm run e2e`.
- Verified no regressions with `pnpm test`.

## Commands Run
- `pnpm run e2e` (failed initially, passed after fixes)
- `pnpm -C packages/client-web test` (passed)
- `pnpm build` (to ensure clean build)
- `pnpm test` (passed)

## Guardrails
Affected Guardrails: NONE
