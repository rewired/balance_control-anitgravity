# Task 0171 — PG-3: Inspector shows action status (Active action / Step / Pinned params)

Status: DRAFT

## Meta
- Owner: Codex
- Area: Inspector read-only action status block
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Read ARCH-06 Inspector responsibilities (action status block).
3. [ ] Baseline scans:
   - `rg -n "inspector" packages/client-web/src/components/GameLayout.tsx`
4. [ ] Baseline tests:
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

## 4) Constraints
- Presentation-only (GR-002): Inspector must not mutate interaction state or commit any move.
- PendingChoice gate (GR-006): in hard-gate, status should reflect that normal actions are disabled.

## 5) Acceptance Criteria
- [ ] Inspector always shows an “Active action” and “Step” line.
- [ ] When Move Influence is in progress, pinned source is displayed.
- [ ] No new click handlers or side effects are introduced in Inspector.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/006).
- [ ] No engine/rule/spec changes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
