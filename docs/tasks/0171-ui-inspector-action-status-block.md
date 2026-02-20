# Task 0171 — PG-3: Inspector shows action status (Active action / Step / Pinned params)

Status: DONE

## Meta
- Owner: Codex
- Area: Inspector read-only action status block
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Read ARCH-06 Inspector responsibilities (action status block).
3. [x] Baseline scans:
   - `rg -n "inspector" packages/client-web/src/components/GameLayout.tsx`
4. [x] Baseline tests:
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Add a read-only **action status block** to the Inspector:
- Active action name (or “None”)
- Current step label (choose action / choose source / choose destination / choose tile / choose variant)
- Pinned params (at minimum: pinned source for Move Influence; pinned tile id for Formalize/Convert)

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (Inspector responsibilities)
- Current Inspector rendering:
  - `packages/client-web/src/components/GameLayout.tsx`
- Controller state:
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

## 3) Outputs
### 3.1 Code
- Add a small read-only component (either inline in `GameLayout` or extracted):
  - `packages/client-web/src/components/InspectorActionStatus.tsx` (preferred)
- Wire it into the Inspector panel (top or bottom section) in `GameLayout`.
- The component reads only from `controller` and renders stable labels.

### 3.2 Tests
- Update/add tests:
  - `packages/client-web/test/selection-inspector.test.tsx` to assert the action status block renders and updates.
  - Include at least one case where `moveInfluenceSourceId` is set so pinned source is visible.

### 3.3 Files touched
- `packages/client-web/src/components/GameLayout.tsx`
- `packages/client-web/src/components/InspectorActionStatus.tsx` (new)
- `packages/client-web/test/selection-inspector.test.tsx`
- `packages/client-web/test/guided-selection-valid-targets-only.test.tsx`

## 4) Constraints
- Presentation-only (GR-002): Inspector must not mutate interaction state or commit any move.
- PendingChoice gate (GR-006): in hard-gate, status should reflect that normal actions are disabled.

## 5) Acceptance Criteria
- [x] Inspector always shows an “Active action” and “Step” line.
- [x] When Move Influence is in progress, pinned source is displayed.
- [x] No new click handlers or side effects are introduced in Inspector.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/006).
- [x] No engine/rule/spec changes.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Created `InspectorActionStatus.tsx` to display active action, step, and pinned parameters based on controller state.
- Integrated `InspectorActionStatus` into `GameLayout.tsx`'s Inspector panel, ensuring it is always visible.
- Added tests in `selection-inspector.test.tsx` to verify the component renders and displays correct information for different states (mocked controller).
- Updated `guided-selection-valid-targets-only.test.tsx` to resolve test failures caused by duplicate "Select source" text (one in prompt, one in inspector).
- Verified implementation passes lint and tests.
