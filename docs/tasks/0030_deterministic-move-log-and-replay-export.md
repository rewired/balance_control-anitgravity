# Codex Task 0030 — Deterministic Move Log + Replay Export (Debug / Tests)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Tests + golden replays + hashing: AGENTS 5.1-5.3
* No implicit effects: CORE-01-10 

---

## Goal

Provide deterministic debugging for Client↔Game communication by adding:

1) a structured **move log** capture (name + payload + playerID + stateID), and  
2) a **replay export/import** path usable by tests and developers.

No gameplay changes.

---

## Inputs

* Existing golden replay + hashing infrastructure (Task 0010).
* boardgame.io client provides `subscribe` to state updates (do not reinvent transport).
* Intents-driven UI (Tasks 0026-0029).

---

## Outputs

### A) Client devtool: move log capture

In `client-web`, add an opt-in debug flag:

- `VITE_DEBUG_REPLAY=1`

When enabled:
- store a ring-buffer list of:
  - `timestamp` (optional, not used for determinism)
  - `playerID`
  - `moveName`
  - `payload`
  - `stateID_before` and `stateID_after` (from boardgame.io)
- expose "Copy replay JSON" button in a small debug panel (dev-only)

The replay JSON must include:
- game name/version (string)
- seed/config if required
- ordered moves array

### B) Replay runner utility (game or shared)

Add a node-side helper that:
- loads replay JSON
- replays moves through the game reducer/client in deterministic mode
- outputs final state hash (existing hashing)

This is used for:
- regression tests
- validating that a reported bug replay reproduces

### C) Tests

- Add at least one integration test that:
  - runs a tiny replay (2-3 moves)
  - asserts final hash equals expected value
- Ensure the replay format is stable and JSON-safe.

---

## Constraints

* Debug timestamps must not affect engine state or hashes.
* Replay runner must not rely on DOM or browser.
* No changes to move behavior.

---

## Invariants

* Same replay produces same final state hash across runs.
* Move log capture does not change UI behavior when disabled.

---

## Acceptance Criteria

1. In dev, replay JSON can be copied and re-run via node test harness.
2. At least one replay test asserts a stable hash.
3. `pnpm -w test` green.

---

## PR Checklist

* [ ] Add move log capture (dev-only flag)
* [ ] Add replay export UI
* [ ] Add replay runner utility (node)
* [ ] Add integration test w/ expected hash
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0030)
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green
