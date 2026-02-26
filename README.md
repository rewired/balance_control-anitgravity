# BALANCE // CONTROL (Software Edition)

Deterministic TypeScript implementation of BALANCE // CONTROL using `boardgame.io`.

This repository contains:
- normative rule specs in `docs/rules/`
- core engine implementation in `packages/game/`
- modular expansion packages (`packages/expansion-01/`, `packages/expansion-02/`, `packages/expansion-03/`)
- supporting packages for rules, server, web client, bot adapter, and shared utilities

## Requirements

- Node.js `>=18` (see root `package.json` engines)
- `pnpm` workspace support (recommended: `pnpm@9` via Corepack)

## Quickstart

```bash
corepack enable
pnpm -w install
pnpm -w test
```

Optional checks:

```bash
pnpm -w lint
pnpm -w build
```

## Network Play (Dev)

```bash
pnpm -w dev
```

Set environment variables for the web client:

- VITE_MULTIPLAYER=server
- VITE_SERVER_URL=http://localhost:8000
- VITE_PLAYER_ID=0
- VITE_MATCH_ID=default

Client default: http://localhost:5173

## Repo Map

- `docs/rules/`
  Normative source of truth for CORE and expansion rules. Code must follow these specs.
- `docs/tasks/`
  Task contracts and implementation checklists used for scoped changes.
- `packages/game/`
  Canonical `boardgame.io` game definition, setup, moves, resolver, and integration tests.
- `packages/expansion-01/`, `packages/expansion-02/`, `packages/expansion-03/`
  Expansion modules registered into the game engine.
- `packages/rules/`
  Shared domain types and rule-level primitives.
- `packages/server/`
  Multiplayer server and lobby wiring.
- `packages/client-web/`
  React client.
- `packages/bot-llm/`
  LLM bot adapter.
- `packages/shared/`
  Shared utilities.

## Determinism and Golden Replays

Determinism is a hard requirement: same seed + same action list must yield the same state outcome.

Golden replay fixtures live in `packages/game/test/golden/` and are exercised by `packages/game/test/golden-replay.test.ts`.
Running `pnpm -w test` includes these replay/hash checks along with the rest of the suite.

## Contributing

- No rules drift: if behavior changes, anchor it to `docs/rules/*`.
- Keep changes deterministic (no time-based or non-seeded randomness in rules logic).
- CI must be green before merge (`.github/workflows/ci.yml`).
- Changelog updates must target only `docs/changelog.md` (canonical path).
- `docs/tasks/archived/**` may contain historical legacy path references; archival text is not normative for current changelog path policy.
