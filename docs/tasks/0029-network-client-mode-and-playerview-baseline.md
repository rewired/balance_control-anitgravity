# Codex Task 0029 — Network Mode Baseline (Client + Server) + PlayerView Guardrails

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules are source of truth: AGENTS 0.1
* No drift: AGENTS 0.5, 0.6
* State model zones: CORE-01-00 

---

## Goal

Add a **clean network play path** (boardgame.io multiplayer) while keeping:
- deterministic rules
- identical UI wiring (still intents-driven)
- correct separation of public vs private state via `playerView`

This is baseline only: connect, play, reconnect, resync.

No new mechanics.

---

## Inputs

* Existing packages:
  - `packages/server` (boardgame.io server)
  - `packages/client-web` (React client)
  - `packages/game` (rules)
* Existing hotseat path already works (Task 0025 + 0027).

---

## Outputs

### A) Client supports two transports: hotseat and network

In `client-web`, add a small environment switch:

- `VITE_MULTIPLAYER=local|server`
- If `server`: use `SocketIO({ server: ... })`
- If `local`: current behavior

The UI components should not change; only the client factory/wrapper changes.

### B) Server baseline is runnable

Ensure `pnpm -w dev` can start server + client:
- document ports and env vars in README or `packages/client-web/README.md`
- keep it minimal and reproducible

### C) Add `playerView` baseline in game

Add (or tighten) `playerView` in `packages/game` so the server never sends:
- other players' private zones (when those exist)
- any pending private choices if they should be hidden (if applicable)

If the game currently has no secrets, still implement a baseline `playerView` that:
- is identity for now
- documents where secrets will be filtered later

### D) Reconnect / sync guardrails

Add minimal UI messaging:
- show "connecting / disconnected" state
- disable input when not synced / not active

Do NOT implement custom optimistic state beyond boardgame.io standard behavior.

### E) Tests

- Smoke test that server can start (node test or minimal e2e harness if present).
- Unit test for `playerView` shape (ensures it does not throw and returns serializable state).

---

## Constraints

* Do not alter deterministic move execution.
* Network client must not diverge from hotseat UI logic.
* No secret leaks: `playerView` must be the only gate for private state.

---

## Invariants

* Same `enumerateLegalIntents` drives UI in both modes.
* A reconnect results in correct state + stage without client-side reconstruction.

---

## Acceptance Criteria

1. Local hotseat still works.
2. Network mode works end-to-end: two browser tabs can join and play turns.
3. Reconnect (refresh tab) resyncs state and input enablement remains correct.
4. `pnpm -w test` green.

---

## PR Checklist

* [x] Add multiplayer transport switch in client-web
* [x] Ensure server startup + docs
* [x] Add/tighten `playerView` in game
* [x] Add minimal connection state UX in client
* [x] Add smoke tests for server + playerView
* [x] Update `docs/PR_TASK_LIST.md` (add Task 0029)
* [x] Update `CHANGELOG.md` (Unreleased)
* [x] CI green

## Work Summary

- Added multiplayer transport switch and connection status indicator.
- Applied playerView filtering for private zones and pending choices.
- Disabled interactions when disconnected or inactive.
- Added playerView and server smoke tests.
- Documented network dev setup and updated changelog/task list.

## Commands Run

```
git status -sb
 M CHANGELOG.md
 M README.md
 M docs/PR_TASK_LIST.md
 M packages/client-web/src/App.tsx
 M packages/client-web/src/components/BoardGrid.tsx
 M packages/client-web/src/components/GameLayout.tsx
 M packages/client-web/src/index.css
 M packages/game/src/client-game.ts
 M packages/game/src/index.ts
?? packages/game/test/player-view.test.ts
?? packages/game/test/server-smoke.test.ts
```

```
git diff --stat
 README.md                                         | 15 +++++++
 docs/PR_TASK_LIST.md                              |  2 +-
 packages/client-web/src/App.tsx                   | 54 +++++++++++++++++++----
 packages/client-web/src/components/BoardGrid.tsx  |  9 ++--
 packages/client-web/src/components/GameLayout.tsx |  1 +
 packages/client-web/src/index.css                 | 19 ++++++++
 packages/game/src/client-game.ts                  | 41 +++++++++++++++++
 packages/game/src/index.ts                        | 41 +++++++++++++++++
 9 files changed, 171 insertions(+), 12 deletions(-)
```

```
pnpm -w lint
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"

=============

WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

You may find that it works just fine, or you may not.

SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

YOUR TYPESCRIPT VERSION: 5.9.3

Please only submit bug reports when using the officially supported version.

=============
```

```
pnpm -w test
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
[56 lines collapsed]
│  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
│ stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inn…  
│ Expansion registered: EXP-02 Security & Order
│ EXP-02 Setup Complete.
│  ✓ test/player-view.test.ts  (2 tests) 4ms
│  ✓ test/server-smoke.test.ts  (1 test) 119ms
│  Test Files  22 passed (22)
│       Tests  84 passed (84)
│    Start at  19:52:33
│    Duration  30.47s (transform 5.62s, setup 1ms, collect 48.40s, tests 3.59s, environment 4ms, prepare 58.11s)
└─ Done in 32.9s
packages/client-web test$ vitest run
│  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
│  ✓ test/Board.test.tsx  (1 test) 2ms
│  ✓ test/controls-start-committee.test.tsx  (1 test) 24ms
│  Test Files  2 passed (2)
│       Tests  2 passed (2)
│    Start at  19:53:06
│    Duration  21.34s (transform 85ms, setup 0ms, collect 1.48s, tests 26ms, environment 12.34s, prepare 1.71s)
└─ Done in 23.8s
```
