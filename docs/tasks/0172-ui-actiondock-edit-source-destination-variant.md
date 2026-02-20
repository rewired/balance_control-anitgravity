# Task 0172 — PG-3: Dock-only Edit semantics (source/destination/variant) + reset rules

Status: DONE

## Meta
- Owner: Codex
- Area: ActionDock edit semantics (contract alignment)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Re-check ARCH-06 draft edit/cancel semantics and checklist sections 3–4.
3. [x] Baseline scans:
   - `rg -n "editDraftParams|editDraftVariant" packages/client-web/src`
   - `rg -n "draftReady" packages/client-web/src/components/ActionDock.tsx`
4. [x] Baseline tests:
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Make dock editing semantics explicit and contract-aligned:
- Provide separate edit intents in ActionDock:
  - Edit source (Move Influence)
  - Edit destination (Move Influence)
  - Edit tile/target (Place Influence / Place Tile)
  - Edit variant (Formalize / Convert / Take Measure)
- Ensure **Cancel** resets the entire action session (action type, step, pinned params, selected variant, draft).
- Confirm is disabled when `draft.isLegalNow === false` (Cancel remains available).

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (draft edit + cancel semantics)
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
- Current controller + dock:
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/components/ActionDock.tsx`
- Existing regression tests:
  - `packages/client-web/test/no-direct-commit-shortcuts.test.ts`
  - `packages/client-web/test/no-auto-commit-board-surface.test.tsx`

## 3) Outputs
### 3.1 Code
- Controller API:
  - Replace the current ambiguous `editDraftParams()` with explicit helpers (names up to you):
    - `editDraftSource()`
    - `editDraftDestination()`
    - `editDraftTarget()` (optional helper for single-target actions)
    - `editDraftVariant()`
  - Ensure each helper clears draft + preview and sets the correct step state.
  - Ensure `cancelDraft()` clears action session state but preserves inspector selection.
- ActionDock:
  - Render the correct edit buttons based on drafted moveType.
  - Disable Confirm when `draft.isLegalNow` is false.

### 3.2 Tests
- Extend/add tests to cover:
  - confirm disabled when draft becomes illegal
  - Cancel resets session state (action + pins) but preserves inspector selection
  - Move Influence draft: edit source and edit destination return to correct steps

### 3.3 Files touched
- `packages/client-web/src/ui/interaction/types.ts`
- `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/test/action-dock.test.tsx`
- `packages/client-web/test/interaction-controller-machine.test.ts`

## 4) Constraints
- Engine authority (GR-002): edits are UI-only transitions; must not manufacture intent payloads.
- PendingChoice gate (GR-006): edits/cancel must not allow bypassing hard-gate.
- No phantom moves (GR-005): do not add new moveTypes or “pass” actions.

## 5) Acceptance Criteria
- [x] ActionDock exposes explicit dock-only edit actions for source/destination/variant.
- [x] Cancel resets the action session (per contract) and does not change inspector selection.
- [x] Confirm is disabled when drafted intent is no longer legal.
- [x] ARCH-06 checklist items 3–4 pass.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005/006).
- [x] No engine/rule/spec changes.
- [x] No new direct commit shortcuts introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## Work Summary
- Updated `InteractionController` interface in `types.ts` to replace `editDraftParams` with `editDraftSource`, `editDraftDestination`, `editDraftTarget`, and `editDraftVariant`.
- Implemented these methods in `useGameInteractionController.ts`, ensuring they correctly reset specific state parts while preserving others (e.g. keeping source when editing destination).
- Updated `cancelDraft` to reset the entire action session (mode, pins) but preserve the inspector selection (`selectedTileId`/`selectedCoord`) as per contract.
- Updated `ActionDock.tsx` to use the new edit methods and display appropriate "Change source/destination/target/selection" buttons.
- Added `disabled={!draft.isLegalNow}` to the "Confirm" button in `ActionDock.tsx`.
- Updated tests in `action-dock.test.tsx` and `interaction-controller-machine.test.ts` to reflect API changes and verify new behavior (including the disabled confirm button).

## Commands Run
- `pnpm -C packages/client-web test` (Passed)
- `pnpm lint` (Passed)

## Guardrails
- GR-002: Engine Authority - Edits are purely UI state transitions; no intent manufacturing.
- GR-005: No Phantom Moves - Only existing legal intents are used.
- GR-006: Pending Choice Gate - Edits do not bypass pending choice restrictions.
