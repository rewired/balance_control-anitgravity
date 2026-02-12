# Task 0003 - Build Health: Types, Exports, Server Imports

## Goal
Make the repo compile reliably:
- fix invalid TS syntax and union duplication
- fix package exports so server imports resolve
- ensure workspace builds in one command

## Inputs
- packages/game/src/engine/types.ts has invalid syntax
- server imports ExpansionRegistry but game package may not export it

## Outputs
- Fix engine/types.ts (no syntax errors, no duplicate union arms)
- Ensure packages/game exports ExpansionRegistry (or update server import path)
- Ensure TS project references / tsconfig are coherent
- Add root script: "build" runs workspace builds (pnpm -r build)

## Constraints
- No gameplay behavior changes.
- Smallest possible edits that restore build stability.

## Invariants
- Determinism work from Task 0002 remains intact.

## Acceptance
- "pnpm -r build" succeeds
- "pnpm -r typecheck" (if exists) succeeds

## PR Checklist (fill at end)
- [ ] Fixed TS syntax/type errors
- [ ] Fixed server import/export wiring
- [ ] Build passes: pnpm -r build
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed TypeScript build errors and package exports for server integration.
