# task(0220): Hotseat: unify render + move authority (single client + updatePlayerID) to eliminate seat desync

- Date: 2026-02-22
- Owner: Codex
- Status: DRAFT
- Task Key: `task/0220-hotseat-unify-client-update-playerid`

---

## 0) Guardrails Gate (MUST)

### affected_guardrails

* GR-002
* GR-004
* GR-005
* GR-006

*(OR write exactly: `NONE`)*

### compliance_notes (required if affected_guardrails != NONE)

- GR-002: Changes are limited to hotseat shell plumbing and interaction routing. No rule/legality computation is introduced in the UI.
- GR-004: All actions still originate from `enumerateLegalIntents(G, ctx, playerId)` and commit only via `dispatchIntent(moves, intent)`.
- GR-005: No new moves are introduced; the hotseat shell only changes *which client instance* dispatches existing moves.
- GR-006: PendingChoice behavior remains hard-gated; seat switching must not allow non-ResolveChoice intents when `G.engine.pendingChoice` exists for the active player.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml: truth.legal_intents_source + selection_rule + forbidden commit paths
* docs/architecture/ARCH-01-ENGINE-CONTRACT.md: CLIENT RESTRICTIONS (presentation-only)
* docs/architecture/ARCH-03-MEASURE-CPU.md: PENDING CHOICE (ResolveChoice-only when pendingChoice exists)

---

## 2) Goal

- Make Hotseat deterministic and reliable by removing the current multi-client state divergence risk.
- Ensure that the state used for rendering, intent enumeration, and move dispatch is always the same authority source.
- Fix the reported failure mode: on P1 turn, tile placement becomes non-interactive or “Skip placement” shows but is rejected.

---

## 3) Non-Goals

- Do not change engine rules or move legality.
- Do not redesign UI (layout/visuals).
- Do not change pack registry or intent taxonomy.

---

## 4) Inputs

- Current implementation:
  - `packages/client-web/src/hotseat/HotseatShell.tsx` currently creates 2 seat clients + 1 spectator client and renders from spectator state while dispatching moves via the active seat client.
  - `packages/client-web/src/ui/useIntentViewModel.ts` enumerates intents from the `G/ctx` passed down by HotseatShell (currently spectator state).
- Known symptom:
  - In hotseat, after switching seats and reaching P1’s turn, placing tiles can stop working; UI may offer “skip placement” which then fails as an invalid move.
- Relevant tests:
  - `packages/client-web/test/hotseat-shell.smoke.test.tsx`
  - `packages/client-web/test/hotseat-seat-switch-next-turn.test.tsx`

---

## 5) Outputs

### 5.1 Code
- Refactor `packages/client-web/src/hotseat/HotseatShell.tsx` to use **one** `boardgame.io` `Client` instance for the match.
  - Use `client.updatePlayerID(activeSeat)` on seat switch (and optionally when `ctx.currentPlayer` changes).
  - Render and dispatch moves from this single client’s `state`.
  - Remove the spectator+dual-seat-client wiring (or keep an optional spectator “peek” mode behind a dev flag, but default path must be single-client).
- Ensure seat switching never leaves stale callbacks or stale controller state:
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts` must reset interaction state on `playerID` changes (already present; keep it working).

### 5.2 Tests
- Strengthen `packages/client-web/test/hotseat-shell.smoke.test.tsx`:
  - Assert only **one** Client instance is created for hotseat.
  - Assert `updatePlayerID` is called on seat switches.
- Add an integration-ish hotseat regression test (no DOM layout assertions):
  - Simulate: start hotseat → complete P0 draw+place+political action → switch to P1 → verify `vm.drawAndPlace.placeTile.length > 0` and a `placeTile` intent can be proposed.
  - If `boardgame.io` client mocking is insufficient, build a minimal harness using the real `createBalanceControlGame()` with `Local()` in a dedicated test under `packages/client-web/test/`.

---

## 6) Constraints (Hard)

- Must keep the UI “presentation-only” boundary: no legality/cost computation in client (ARCH-01 / GR-002).
- Hotseat must remain functional without network/lobby.
- Seat switching must not require page reload.
- No new global state; keep changes localized to `hotseat/` + minimal controller glue.

---

## 7) Invariants (Must remain true)

- All committed actions must still be chosen from `enumerateLegalIntents(G, ctx, playerId)` (GR-004).
- If `G.engine.pendingChoice` exists for the current player, only ResolveChoice intents are dispatchable (GR-006).
- No “phantom move” UI: if an intent is shown as available, dispatching it from the current hotseat state must not be rejected as INVALID_MOVE (GR-005).
- Determinism: no use of `Date.now`, `Math.random`, or unstable ordering.

---

## 8) Implementation Plan

1) Simplify hotseat shell to a single `Client` instance:
   - Create client once via `useMemo`.
   - Maintain `activeSeat` in state.
   - Call `client.updatePlayerID(activeSeat)` on seat switch.
   - Subscribe to client state and store `{ G, ctx }` for rendering.
2) Ensure the GameLayout receives `G/ctx/moves/playerID/isActive` from the same client instance.
3) Verify PendingChoice hard-gate still works after seat switching.
4) Update tests + add regression test for “P1 cannot place tile after seat switch”.

---

## 9) Acceptance Criteria

- [ ] Hotseat: Switching to P1 and reaching P1’s turn allows selecting a ghost coord and proposing a `placeTile` intent.
- [ ] Hotseat: A `placeTile` intent proposed by UI is accepted (no INVALID_MOVE) in the same state it was enumerated from.
- [ ] Hotseat: No “Skip placement” is shown unless it is actually legal and executable from the same state source.
- [ ] `pnpm -C packages/client-web test` passes.
- [ ] `pnpm -C packages/client-web build` passes (or workspace build passes).

---

## 15) PR Checklist (to be filled during implementation)

- [x] Preflight: read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- [x] Engine/client boundary respected (ARCH-01)
- [x] Determinism preserved (no Date.now/Math.random)
- [x] Tests updated/added as needed and pass
- [x] Task file updated with Work Summary + Commands Run
- [x] Single meaningful commit with Postflight block

### Work Summary
- Refactor `HotseatShell` to a single `boardgame.io` client and unify render + move authority.
- Switch seats via `client.updatePlayerID(activeSeat)` and render from the same client state source.
- Update hotseat smoke tests to assert single client + `updatePlayerID` on seat switches.
- Add regression test that advances a turn, switches seats, and asserts `placeTile` intents exist for the next player.

### Commands Run
- `pnpm -C packages/client-web test` (pass)
- `pnpm -C packages/client-web build` (pass)
