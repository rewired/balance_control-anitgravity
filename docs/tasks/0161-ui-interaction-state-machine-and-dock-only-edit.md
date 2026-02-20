# Task 0161 — PG-1: Enforce interaction state machine + dock-only edit semantics (freeze board in draftReady)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI interaction controller semantics
- Packages: `packages/client-web`
- Skills: S07 (UX Consistency), S05 (Boundary Check)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-check ARCH-06 contract + checklist for the exact state machine expectations.
3. [ ] Baseline scan (no edits yet):
   - `rg -n "interactionState" packages/client-web/src/ui/interaction`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Make the interaction controller behave like a real state machine and enforce “dock-only edit” rules:
- `interactionState` must be one of:
  - `selectingAction`, `selectingParams`, `selectingVariant`, `draftReady`, `pendingChoiceHardGate`
- While `draftReady`, the BoardSurface must be **inspect-only** (no parameter changes, no re-drafting via board clicks).
- Provide minimal ActionDock controls to re-enter parameter selection (“Edit …”) without requiring a full cancel.

## 2) Inputs
- Normative contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (state machine + dock-only edit)
- Current controller + surfaces:
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/components/ActionDock.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`

## 3) Outputs
### 3.1 Code
- Controller:
  - Add explicit transition helpers (pure functions preferred) to compute `interactionState`.
  - Add “edit draft” APIs (names are up to you, but keep small and explicit), e.g.:
    - `editDraftParams()` → drops current draft, keeps current action selection, returns to `selectingParams`
    - `editDraftVariant()` → re-opens variant selection for wizard actions (if applicable)
  - Enforce: if `interactionState === 'draftReady'`, `proposeIntent(...)` must not accept board-driven parameter changes.
    - The only allowed mutation while `draftReady` is `selectTile(...)` for inspector.
- BoardSurface wiring:
  - Update `HexBoard` click handlers so that, in `draftReady`, clicks do not propose new intents even if a mode is active.
  - Keep existing highlight logic as-is unless it becomes misleading (avoid visual redesign).
- ActionDock:
  - When `draftReady`, show minimal “Edit” control(s) appropriate for the drafted moveType, e.g.:
    - PlaceTile: “Change placement”
    - MoveInfluence: “Change source/target” (best-effort; minimal)
    - Wizard-driven drafts: “Change selection” (re-open wizard)

### 3.2 Tests
- Add/update tests to ensure:
  - In `draftReady`, clicking a valid board target does NOT change the draft.
  - Draft can be edited only via ActionDock controls.

### 3.3 Files touched
- `packages/client-web/src/ui/interaction/types.ts`
- `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/components/HexBoard.tsx`
- `packages/client-web/src/components/BoardViewport.tsx` (if needed)
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- Engine authority (GR-002): “Edit” must only return the UI to selecting steps; it must not manufacture a new intent.
- Pending choice gate (GR-006): edits and drafts must be disabled/cleared when pendingChoice exists.
- No auto-commit.

## 5) Acceptance Criteria
- [ ] Controller `interactionState` matches ARCH-06 definitions.
- [ ] While in `draftReady`, BoardSurface is inspect-only (no draft changes from board).
- [ ] User can re-enter selection (edit draft) only from ActionDock.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] No new commit shortcut introduced.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
