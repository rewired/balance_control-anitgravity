# task(0222): Remove passTilePlacement as a player action; auto-run final settlement per CORE-01-09-01A and VAR-01-01-08

- Date: 2026-02-22
- Owner: Codex
- Status: DRAFT
- Task Key: `task/0222-engine-remove-pass-tile-placement-autosettle`

---

## 0) Guardrails Gate (MUST)

### affected_guardrails

* GR-002
* GR-003
* GR-004
* GR-005
* GR-011

*(OR write exactly: `NONE`)*

### compliance_notes (required if affected_guardrails != NONE)

- GR-002/GR-004/GR-005: Align engine move surface with the spec: no extra “pass” move that creates phantom choices or UI-only escape hatches.
- GR-003: Keep deterministic end-game behavior; no timing-based termination.
- GR-011: Final settlement must use the canonical production sweep order and run exactly once.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE-01-09-01A: Final Settlement Trigger (automatic, no player choice)
* VAR-01-01-08: TileRecycling termination guard (treat as draw pile empty and end)
* CORE-01-07-03D: Resort Production Sweep Order (canonical PositionKey order)
* ARCH-01 / ARCH-03: legal-intents surface + PendingChoice rule boundaries

---

## 2) Goal

- Eliminate the “Skip placement” pathway as an explicit player move.
- When the game reaches the end condition (draw pile empty at draw phase start OR no legal placements), the engine must automatically:
  1) Run final round settlement exactly once
  2) End the game immediately (no further turns, no extra round settlement)
- This removes a recurring confusion point and prevents hotseat from offering a “move” that users correctly perceive as illegitimate.

---

## 3) Non-Goals

- Do not change scoring rules.
- Do not change draw pile shuffle behavior.
- Do not add new UI steps.

---

## 4) Inputs

- Current code:
  - Engine exposes `passTilePlacement` as a drawAndPlace-stage move:
    - enumerated in `packages/game/src/engine/legal-intents.ts`
    - implemented in `packages/game/src/moves/stages/drawAndPlace.ts`
  - Hotseat UI renders a “Skip placement” button when that intent exists (`packages/client-web/src/components/ActionDock.tsx`).
- Risk:
  - Spec requires *automatic* final settlement and immediate end (no player decision).
  - Current implementation can also accidentally double-trigger settlement depending on turn end hooks.

---

## 5) Outputs

### 5.1 Code (Engine)
- Remove `passTilePlacement` from:
  - `packages/game/src/engine/legal-intents.ts` (do not enumerate it)
  - `packages/game/src/moves/stages/drawAndPlace.ts` (delete move)
  - `packages/game/src/index.ts` stage move list (`DRAW_AND_PLACE_MOVE_IDS`)
- Implement automatic final settlement:
  - In `turn.onBegin` (or a dedicated hook called from there), if:
    - staging is empty AND draw pile empty → run final settlement, set `roundSettlementDone = true`
    - OR engine flag `noLegalPlacements` true (VAR-01-01-08) → same
  - Ensure this path runs exactly once and cannot be re-entered.
  - Ensure it does not also trigger the regular round settlement hook path.
- Add/adjust `endIf` if needed so that the game ends immediately after final settlement.

### 5.2 Code (Client)
- Remove “Skip placement” UI rendering:
  - `packages/client-web/src/components/ActionDock.tsx` should not mention/expect passTilePlacement.
- If needed, add a passive “Game over / final settlement running” notice in the dock (read-only).

### 5.3 Tests
- Add engine-level unit/integration test:
  - Construct a state where draw pile is empty at turn start.
  - Assert the game transitions to gameover after final settlement without any player move.
- Add a client test that “Skip placement” is never rendered.

---

## 6) Constraints (Hard)

- Must remain deterministic (seeded RNG only).
- Must not introduce a new player decision at end-of-game.
- Must not run settlement twice.

---

## 7) Invariants (Must remain true)

- End-game condition behavior matches spec:
  - No player move is required to trigger final settlement.
  - Final settlement runs exactly once.
  - Game ends immediately afterwards.
- The legal intent surface contains only spec-authorized moves.

---

## 8) Implementation Plan

1) Remove the `passTilePlacement` move and intent everywhere.
2) Add a single automatic end-game trigger in `turn.onBegin`:
   - detect draw pile empty at draw phase start or noLegalPlacements
   - run final settlement
   - mark `roundSettlementDone`
3) Verify `turn.onEnd` does not run a second settlement pass in this end-game path.
4) Update client UI/tests to remove the button.
5) Add tests for automatic end-game.

---

## 9) Acceptance Criteria

- [ ] No `passTilePlacement` appears in `enumerateLegalIntents`.
- [ ] Hotseat/online: when draw pile is empty at the start of DrawAndPlace, the game ends without any player action.
- [ ] Final settlement runs exactly once (no duplicate production).
- [ ] Client UI does not show “Skip placement”.
- [ ] `pnpm -w test` passes (or at minimum `pnpm -r test` for touched packages).

---

## 15) PR Checklist (to be filled during implementation)

- [ ] Preflight: read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- [ ] Engine/client boundary respected (ARCH-01)
- [ ] Determinism preserved (no Date.now/Math.random)
- [ ] Tests updated/added as needed and pass
- [ ] Task file updated with Work Summary + Commands Run
- [ ] Single meaningful commit with Postflight block
