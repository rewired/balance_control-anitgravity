# Task 0168 — PG-3: ActionDock IA skeleton (group list + Current Action Panel, draftReady hides list)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI ActionDock IA (no modals)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Read ARCH-06 contract + checklist:
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
3. [ ] Baseline scans (no edits yet):
   - `rg -n "More actions|measure-tray|Skip placement" packages/client-web/src/components/ActionDock.tsx`
   - `rg -n "WizardModal|ConvertWizardModal|FormalizeWizardModal" packages/client-web/src/components`
4. [ ] Baseline tests:
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Introduce a contract-compliant **information architecture** for the ActionDock without changing game behavior yet:
- Action selection appears as a **group list** (Influence / Committees / Economy / Measures / Expansions → Other).
- Add a **Current Action Panel** that always shows:
  - Active action (or “Choose action”)
  - Current step (choose source / destination / tile / variant)
  - Pinned params (best-effort: pinned source for Move; pinned tile for Formalize/Convert)
- When `interactionState === 'draftReady'`, show **ONLY** the Current Action Panel (hide the group list).

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
- Current dock + wiring:
  - `packages/client-web/src/components/ActionDock.tsx`
  - `packages/client-web/src/components/GameLayout.tsx`
- Controller state (read-only consumption):
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

## 3) Outputs
### 3.1 Code
- Refactor `ActionDock` rendering into two sections:
  - **CurrentActionPanel** (new subcomponent inside file or extracted subcomponent)
  - **ActionGroupList** (new subcomponent inside file or extracted subcomponent)
- Keep existing behavior for now:
  - Still allow existing actionMode toggles to drive board guided selection.
  - Still allow existing “wizard” flow for Formalize/Convert for now (modals removed in Task 0169).

### 3.2 Tests
- Update `packages/client-web/test/action-dock.test.tsx` to assert:
  - group headings are present in `politicalAction`
  - Current Action Panel exists and shows step label
  - group list is hidden when `interactionState === 'draftReady'`

### 3.3 Files touched
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/test/action-dock.test.tsx`
- (optional) small UI helper additions local to `ActionDock` only

## 4) Constraints
- **No commits from components** (GR-002): ActionDock must call only controller APIs (confirm/cancel/edit) and never `dispatchIntent(...)` or `moves.*`.
- **No phantom actions** (GR-005): Group list must be derived from currently enumerated intents and/or known core action types already present.
- **PendingChoice gate** (GR-006): In `pendingChoiceHardGate`, ActionDock must remain non-interactive for normal actions.
- No i18n infrastructure changes in this task (PG-6).

## 5) Acceptance Criteria
- [ ] In `politicalAction`, ActionDock shows the action **group list** and a **Current Action Panel**.
- [ ] When `interactionState === 'draftReady'`, the group list is hidden and only the Current Action Panel remains.
- [ ] No new auto-commit paths are introduced.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] No direct commit shortcuts introduced.
- [ ] ARCH-06 checklist items 1–4 remain satisfied.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
