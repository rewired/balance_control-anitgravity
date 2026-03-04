# DD-0324 — Client-web TypeScript build fixes for bot bridge imports and seat typing

## Status
Accepted — 2026-03-03

## Context
`packages/client-web` failed at `tsc` with three error classes:

1. **TS6307** because `src/bot/orchestratorBridge.ts` imports `packages/bot-llm/src/turn-orchestrator.ts`, but `client-web/tsconfig.json` did not include `../bot-llm/src` in its program file set.
2. **TS2339** because `SeatConfig` is a union (`SeatHumanConfig | SeatBotConfig`) and `.model` was accessed without a stable `SeatBotConfig` narrow.
3. **TS2353** because the boardgame.io `ClientOpts` type does not declare `setupData`, even though the runtime path currently accepts and uses it for game setup.

The break blocks front-end build validation and downstream pipelines.

## Decision
Adopt minimal, deterministic typing/project wiring changes:

1. Extend `packages/client-web/tsconfig.json` with:
   * `paths["@balance-control/bot-llm"] = ["../bot-llm/src"]`
   * `include` entry for `../bot-llm/src`
2. In `orchestratorBridge.ts`, make `isBotSeat(...)` a `SeatBotConfig` type guard and use it before reading `model`.
3. In `HotseatShell.tsx`, preserve existing runtime options and apply a local type assertion (`as any`) at the `Client(...)` call site so `setupData` remains wired as today while satisfying compile checks.

## Consequences

### Positive
* Restores `packages/client-web build` success without changing gameplay semantics.
* Preserves bot orchestration contract and seat-model behavior.
* Keeps fix small and isolated to compile-time constraints.

### Negative / Trade-offs
* `setupData` remains an extension beyond declared boardgame.io `ClientOpts`; a local type assertion is needed until upstream types align.

## Alternatives Considered

1. **Import bot orchestration from built `@balance-control/bot-llm` dist only**.
   Rejected for this task because `client-web` build pre-step does not guarantee `bot-llm` dist availability.
2. **Remove hotseat `setupData` usage**.
   Rejected because it would break configured seat behavior (human/bot role setup) and alter runtime semantics.
