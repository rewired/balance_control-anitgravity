# Task 0050 — Client-Web: Lobby Start Screen (Create/List/Join) + Quit (leaveMatch)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0050-client-web-lobby-start-screen`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-005
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Lobby UI only calls Lobby API + dispatches existing `moves.*` from the engine; it does not compute legality/costs/majority.
* GR-005: No new moves/intents are introduced; “Quit game” is UI-only and uses Lobby `leaveMatch` (not an engine move).
* GR-014: Keep tile/icon mapping untouched; lobby UI styling must not change tile rendering semantics.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS
* ARCH: ARCH-01:LEGALITY_ENUMERATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* App starts on a Lobby start screen (classic boardgame.io lobby UX), not directly in a match.
* Lobby supports: list matches, create match (numPlayers + expansions), and join a specific seat with a player name.
* Joining a seat immediately transitions into the in-game screen using `SocketIO` multiplayer with the returned `playerCredentials`.
* In-game screen has a “Quit game” button that calls Lobby `leaveMatch`, stops the client, and returns to the Lobby screen.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not implement AI players, hotseat-only local mode, or any non-lobby matchmaking.
* Do not implement rule variants or player “type” selection (only stub UI, disabled, TODO).
* Do not implement session persistence / resume (handled in Task 0051).
* Do not change engine rules, legality, or state shape.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/App.tsx` (currently boots directly into match via URL/env)
  * `packages/client-web/src/Board.tsx` + `packages/client-web/src/components/*` (current in-game UI)
  * `packages/server/src/index.ts` (boardgame.io server on port 8000)
  * `packages/game/src/setup.ts` + `packages/game/src/config.ts` (setupData → expansions flags)
* Existing behavior summary (current):

  * Web client immediately starts a match using URL params/env (`player`, `match`, `VITE_MULTIPLAYER`).
  * No lobby, no create/join, no quit/leave.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/App.tsx` updated to support screen switching: Lobby ↔ Game.
* `packages/client-web/src/components/LobbyScreen.tsx` added (or equivalent) using boardgame.io `LobbyClient`.
* In-game “Quit game” UI wired to `leaveMatch` (likely in `packages/client-web/src/components/GameLayout.tsx` or a new top bar component).

### 5.2 Tests

* `packages/client-web/test/lobby-screen.test.tsx` added:
  * list matches renders seats
  * join transitions to game screen using returned credentials
  * quit calls `leaveMatch` and returns to lobby

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (Unreleased): Lobby start screen + join/quit via boardgame.io lobby.
* [ ] `docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A expected.
* [ ] `docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A.

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources in engine (client is allowed to use time for display only, but avoid it).
* Engine authority: rules/legality/costs computed only in `packages/game`.
* Lobby strictness: create/list/join/leave must use boardgame.io Lobby API (`LobbyClient`), not custom server endpoints.
* No phantom moves: do not add engine moves for “quit” or lobby actions.
* Expansion isolation: UI toggles only affect `setupData` for match creation; no client-side expansion state.

---

## 7) Invariants (Must remain true)

* UI remains presentation-only; no legality computation in client.
* Existing in-game UI remains intent-driven (ActionPanel, ghost hexes) and uses existing engine `enumerateLegalIntents`.
* “Quit game” does not mutate engine state; it only leaves the match via Lobby API and stops the client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Add `LobbyScreen` component:
  * [ ] Create `LobbyClient({ server: VITE_SERVER_URL })`.
  * [ ] Load match list via `listMatches(BalanceControl.name)` with refresh button.
  * [ ] Create-match form:
    * [ ] `numPlayers` select (2–6).
    * [ ] expansion toggles `ex01/ex02/ex03` stored in local UI state.
    * [ ] “player type” + “rule variants” inputs present but disabled + TODO label.
    * [ ] create via `createMatch(gameName, { numPlayers, setupData: { expansions } })`, then refresh list.
  * [ ] Seat join:
    * [ ] Per-seat “Join” button calls `joinMatch(gameName, matchID, { playerID, playerName })`.
    * [ ] On success, call `onJoin({ matchID, playerID, credentials, playerName })`.
* [ ] Refactor `App.tsx` to manage screen state:
  * [ ] Default screen is Lobby.
  * [ ] On join: create `Client({ game: BalanceControl, multiplayer: SocketIO({ server }), matchID, playerID, credentials })`.
  * [ ] Start/stop client on screen transitions; subscribe to state updates.
* [ ] Add in-game “Quit game” button:
  * [ ] Calls `LobbyClient.leaveMatch(gameName, matchID, { playerID, credentials })`.
  * [ ] Stops client and returns to Lobby screen on success.
  * [ ] On error: show UI error and keep game running (no silent failures).
* [ ] Add RTL tests for lobby list/create/join/quit using mocked `fetch` (LobbyClient) and minimal client lifecycle assertions.

Notes:

* If any step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Opening client-web shows Lobby start screen (not the game board).
* [ ] Create match with selected `numPlayers` and `setupData.expansions` succeeds (via Lobby API) and appears in the match list after refresh.
* [ ] Joining a specific seat transitions directly into the game screen and dispatching moves works (client uses `credentials`).
* [ ] “Quit game” calls `leaveMatch` and returns to the Lobby screen.
* [ ] `pnpm -C packages/client-web test` is green.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `CHANGELOG.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* N/A (not implemented yet)

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* N/A

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
N/A
```

### 13.2 git diff --stat

```
N/A
```

### 13.3 Tests

```
N/A
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
N/A
```

---

## 15) Amendments (append-only)

N/A

