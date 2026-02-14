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

* [ ] Add multiplayer transport switch in client-web
* [ ] Ensure server startup + docs
* [ ] Add/tighten `playerView` in game
* [ ] Add minimal connection state UX in client
* [ ] Add smoke tests for server + playerView
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0029)
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green
