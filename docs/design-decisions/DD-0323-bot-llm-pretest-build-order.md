# DD-0323 — Bot-LLM pretest build order for `@balance-control/game` type resolution

- **Status:** Accepted
- **Date:** 2026-03-03
- **Task:** 0323

## Context

`pnpm -w test` failed in `packages/bot-llm` during `pretest` because the chained build script compiled `@balance-control/packs` before `@balance-control/game`.

`packages/packs` TypeScript paths resolve `@balance-control/game` to `../game/dist/index.d.ts`. When `game` has not been built yet, `packs` build fails with TS2307 module-resolution errors.

## Decision

Reorder `packages/bot-llm` `pretest` build chain to compile `@balance-control/game` before `@balance-control/packs`.

## Rationale

- Keeps existing package boundaries and path mapping strategy unchanged.
- Fixes the immediate deterministic workspace failure with minimal scope.
- Avoids introducing broader tsconfig or dependency graph changes unrelated to the reported failure.

## Consequences

- `pnpm -w test` no longer fails at `packages/bot-llm pretest` due to missing `@balance-control/game` declarations.
- No gameplay/engine behavior changes.
- No rule-anchor implications (build orchestration only).
