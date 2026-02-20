# Codex Task 0149 — UI: Define interaction surfaces + central interaction controller (no behavior change)

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0149
- **Owner:** Codex
- **Area:** `packages/client-web/src/**` + docs
- **Priority:** P1
- **Risk:** Low (refactor + new contract doc; no rules/engine changes)
- **Branch name:** `task/0149-ui-interaction-surfaces-and-controller`
- **Skills:** S05 (Boundary Check), S07 (UX Consistency), S04 (Determinism Guard)

## 1) Guardrails (frozen)

- **GR-002 (Engine-only Rule Execution):** client remains presentation-only; no legality/cost/majority/modifier logic added to UI.
- **GR-006 (Pending Choice Gate):** when `G.engine.pendingChoice` exists, UI must behave as “ResolveChoice-only”.
- **GR-005 (No Phantom Moves):** do not add “pass/end turn” UI actions beyond existing legal intents.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` — client restrictions + intent API.
- `docs/architecture/TECH-01-BIG-PICTURE.md`
  - Section “Intents: the one true API” (preview is engine-derived; client does not re-implement rules).
  - Section “System goal” (authoritative simulation vs presentation).
- `docs/rules/000-core.md` — `CORE-01-04-01..03` (two-phase turn structure) + `CORE-01-04-09` (ExactlyOnePoliticalAction).
- Current UI entry points:
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/components/ActionPanel.tsx`
  - `packages/client-web/src/components/MoveConfirmationModal.tsx`
  - `packages/client-web/src/components/PendingChoiceModal.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/ui/useIntentViewModel.ts`

## 3) Context (frozen)

The game-area UI already follows the “intents first” direction, but the interaction logic is currently spread across:
- `GameLayout` (selection + modal wiring),
- `HexBoard` (board click behaviors + ad-hoc intent probing),
- `ActionPanel` (dispatch),
- individual modals.

This makes it hard to evolve towards:
- stable, named **interaction surfaces**,
- a consistent “select → review → commit” flow (“bot-safe”),
- and multi-step selection (for intent-heavy actions like Formalize / Convert).

This task creates **structure and contracts** only — behavior remains the same.

## 4) Goal (frozen)

- Add a **UI interaction contract** doc to make the game-area UI future-proof.
- Introduce a **single interaction controller hook** that owns local UI state:
  - selected tile for inspection,
  - pending choice modal state,
  - (existing) move confirmation modal state,
  - intent dispatch helper.
- Keep user-visible behavior equivalent to current `main` snapshot.

## 5) Scope (frozen)

### 5.1 In-scope

**Docs**
- Add `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md` (new; Version 1.0; Status: Normative).
  - Define the game-area interaction surfaces (BoardSurface, ActionDock, ModalHost, Inspector).
  - Define the only allowed “command” path: `LegalIntent` → `moves[moveType](payload)`.

**Client refactor (no behavior change)**
- Add `packages/client-web/src/ui/interaction/`:
  - `types.ts` (UI-only types)
  - `dispatchIntent.ts` (single helper to execute a `LegalIntent` safely)
  - `useGameInteractionController.ts` (central local UI state + callbacks)
- Add `packages/client-web/src/components/ModalHost.tsx`:
  - Renders `PendingChoiceModal` and `MoveConfirmationModal` using the controller state.
- Update `GameLayout.tsx` to use the controller and `ModalHost`.
- Do **not** change `useIntentViewModel` public API in this task.

### 5.2 Out-of-scope

- Any engine changes.
- Any re-design of phase flow or action semantics.
- Any new UI for selecting payment resources.
- Any “new” UI actions that are not already legal intents.

## 6) Plan (frozen)

1) **Add ARCH-06 doc**
   - Create `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`.
   - Keep it short and concrete (surfaces + state machine + restrictions).
   - Reference ARCH-01 + TECH-01.

2) **Create interaction controller skeleton**
   - Implement `useGameInteractionController({ G, ctx, playerID, moves, intents })`.
   - Own state:
     - `selectedTileId: string | null`
     - `pendingChoiceOpen: boolean` (derived from `G.engine.pendingChoice`)
     - `confirmIntent: LegalIntent | null` (existing move confirm path)
   - Expose callbacks:
     - `selectTile(tileId | null)`
     - `proposeIntent(intent)`
     - `confirmProposedIntent()` / `cancelProposedIntent()`
     - `resolveChoice(selection)` (delegates to dispatchIntent)

3) **Move dispatch into a single helper**
   - Implement `dispatchIntent(moves, intent)`:
     - look up `moves[intent.moveType]`
     - call with `intent.payload` (or no args if payload is `undefined`)
     - never call twice
     - return boolean success (true if function existed and was called)

4) **Add ModalHost**
   - `ModalHost` renders:
     - `PendingChoiceModal` when `G.engine.pendingChoice` exists
     - `MoveConfirmationModal` when `confirmIntent` exists
   - Wire callbacks through controller.

5) **Update GameLayout wiring**
   - Remove ad-hoc modal state; use controller.
   - Keep layout + panels intact.

6) **Update tests**
   - Minimal changes only for moved components/props.
   - Ensure existing client-web tests still pass.

## 7) Acceptance criteria (frozen)

- [ ] New doc exists: `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`.
- [ ] `GameLayout` renders and behaves as before (manual smoke: place tile, move influence confirm, pending choice).
- [ ] No new rule logic is introduced in client-web (no legality/cost/majority computation beyond filtering already-enumerated intents).
- [ ] `pnpm -w test` is green.
- [ ] No changes in `packages/game/**` in this task.
