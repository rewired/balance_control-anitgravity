# Codex Task 0150 — UI: ActionDock + consistent “draft → confirm → commit” for Place/Move Influence

**Date:** 2026-02-20
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0150
- **Owner:** Codex
- **Area:** `packages/client-web/src/**`
- **Priority:** P1
- **Risk:** Medium (interaction changes in the most-used actions)
- **Branch name:** `task/0150-ui-actiondock-confirm-influence`
- **Skills:** S07 (UX Consistency), S05 (Boundary Check)

## 1) Guardrails (frozen)

- **GR-002 (Engine-only Rule Execution):** UI may only filter/choose from already-enumerated intents; do not compute new legality.
- **GR-006 (Pending Choice Gate):** when pendingChoice exists, all other UI interaction is blocked.
- **GR-005 (No Phantom Moves):** no “end turn / pass political action”.

## 2) Spec anchors (frozen)

- `docs/rules/000-core.md`
  - `CORE-01-04-09` (ExactlyOnePoliticalAction)
  - `CORE-01-04-11` (PlaceInfluence)
  - `CORE-01-04-12` (MoveInfluence)
  - `CORE-01-04-12B` (Return Penalty notice in confirm)
- `docs/architecture/TECH-01-BIG-PICTURE.md` — “Intents: the one true API” (draft/preview must be engine-derived).
- Existing UI files:
  - `packages/client-web/src/components/ActionPanel.tsx` (to be replaced or reduced)
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/ui/useIntentViewModel.ts`
  - Interaction controller added in Task 0149

## 3) Context (frozen)

Today:
- PlaceInfluence is a button in `ActionPanel` that **immediately commits** when enabled.
- MoveInfluence is a “click target on board → confirmation modal → commit”.

This is inconsistent and makes future multi-step actions (Formalize/Convert) harder.

We want a consistent pattern:
**select parameters → draft intent → confirm → commit**.

This task only covers **PlaceInfluence and MoveInfluence**.

## 4) Goal (frozen)

- Introduce a first-class **ActionDock** surface for the politicalAction phase.
- Make **both PlaceInfluence and MoveInfluence** follow the same confirmation flow:
  - selecting a legal target(s) drafts an intent
  - confirmation modal shows consequences (incl. Return Penalty)
  - only after confirm does the move dispatch

## 5) Scope (frozen)

### 5.1 In-scope

- Add `packages/client-web/src/components/ActionDock.tsx`:
  - shows current phase (drawAndPlace vs politicalAction)
  - in politicalAction: shows action mode buttons:
    - “Place Influence”
    - “Move Influence”
    - (keep a compact “More actions” fallback list for non-covered intents; unchanged behavior)
- Add/extend controller state:
  - `actionMode: 'none' | 'placeInfluence' | 'moveInfluence'`
  - `moveInfluenceSourceId: string | null` (only while in move mode)
- Update `HexBoard` interaction:
  - In `placeInfluence` mode: board highlights legal `targetTileId` tiles; clicking one drafts the matching intent.
  - In `moveInfluence` mode:
    - Step 1: clicking a source tile sets `moveInfluenceSourceId`
    - Step 2: highlight legal `targetId` tiles for that source; clicking drafts the matching intent.
  - Keep “selection for inspector” behavior when `actionMode === 'none'`.
- Confirmation modal:
  - Reuse existing `MoveConfirmationModal` if possible, but make it generic enough for placeInfluence too.
  - Must display `intent.consequences` (already present for some moveInfluence intents).
- Remove “instant commit” for placeInfluence (no direct dispatch button).

### 5.2 Out-of-scope

- FormalizeInfluence / ConvertResources wizards (next tasks).
- Any changes to legality enumeration or move payloads.
- Any new cost-selection UI (still uses payload from intent as-is).

## 6) Plan (frozen)

1) **Add ActionDock**
   - Replace `ActionPanel` usage in `GameLayout` with `ActionDock`.
   - Ensure disabled state when not active player.

2) **Add action mode state**
   - Store in controller.
   - Reset mode/source when phase changes or turn ends (best effort; rely on `ctx.activePlayers` + `playerID`).

3) **Board integration**
   - Compute legal targets solely from `vm.intents`:
     - placeInfluence targets = `intent.payload.targetTileId`
     - moveInfluence sources = `intent.payload.sourceId`
     - moveInfluence targets = filtered by chosen source
   - Highlight targets with a simple CSS class (no new iconography required).

4) **Draft + confirm**
   - Clicking a target drafts the exact matching `LegalIntent`.
   - Modal confirm dispatches via `dispatchIntent`.

5) **Tests**
   - Update/replace:
     - `packages/client-web/test/action-panel.test.tsx`
     - `packages/client-web/test/controls-start-committee.test.tsx`
   - New tests should verify:
     - placeInfluence does **not** dispatch on click until confirm
     - moveInfluence still requires confirm
     - StartCommittee tiles never appear as legal place targets when intents do not include them.

## 7) Acceptance criteria (frozen)

- [ ] In politicalAction phase, “Place Influence” and “Move Influence” are selectable modes.
- [ ] PlaceInfluence is **always confirm-gated** (no auto-commit).
- [ ] MoveInfluence remains confirm-gated; Return Penalty consequences render if present.
- [ ] PendingChoice continues to block all other actions.
- [ ] Client tests are green.
