# Task 0169 — PG-3: Dock-only Formalize/Convert variants (remove wizard modals)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI ActionDock IA (no modals)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-check ARCH-06 sections on ModalHost + variant selection.
3. [ ] Baseline scans (no edits yet):
   - `rg -n "FormalizeWizardModal|ConvertWizardModal|wizard" packages/client-web/src`
   - `rg -n "selectingVariant" packages/client-web/src/ui/interaction`
4. [ ] Baseline tests:
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Eliminate normal-action modals for Formalize/Convert and make **variant selection dock-only**:
- Selecting a Committee/Grassroots tile pins it, then the dock shows the available variants.
- Selecting a variant creates a draft intent (`draftReady`), and **Confirm/Cancel remain in the dock**.
- Remove the Formalize/Convert wizard modals from the normal flow (PendingChoiceModal remains unchanged).

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (ModalHost optional; confirm is dock-only)
- Existing wizard grouping helpers:
  - `packages/client-web/src/ui/interaction/formalizeHelpers.ts`
  - `packages/client-web/src/ui/interaction/convertHelpers.ts`
- Current wizard plumbing:
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/components/ModalHost.tsx`
- Dock:
  - `packages/client-web/src/components/ActionDock.tsx`

## 3) Outputs
### 3.1 Code
- Controller:
  - Remove (or disable) `wizard` state for Formalize/Convert.
  - Replace it with pinned parameters usable by the dock:
    - `pinnedCommitteeTileId` and/or `pinnedGrassrootsTileId` (names up to you, but keep explicit).
  - Ensure `interactionState === 'selectingVariant'` is driven by action session state, not ModalHost.
  - Ensure “under-variants” are shown only after a **valid tile selection** (ARCH-06).
- ActionDock:
  - In Committees/Economy groups, when action is active and a tile is pinned, show deterministic variant lists:
    - Formalize: group by payment combo (use `groupFormalizeIntents`), then variant items.
    - Convert: group by outputResort then input combo (use `groupConvertIntents`), then variant items.
  - Selecting a variant calls `controller.proposeIntent(intent)` (no commit).
- ModalHost:
  - Stop rendering `FormalizeWizardModal` and `ConvertWizardModal` entirely.
  - Keep `PendingChoiceModal` behavior unchanged.
  - Optional: keep wizard component files in repo (unused) for now; no re-export / no imports.

### 3.2 Tests
- Replace modal-based tests with dock-based ones:
  - Update/remove:
    - `packages/client-web/test/formalize-wizard.test.tsx`
    - `packages/client-web/test/convert-wizard.test.tsx`
  - Add/extend `packages/client-web/test/action-dock.test.tsx` (or add a dedicated test) to cover:
    - pin tile → variants appear in dock
    - selecting a variant → draftReady → confirm/cancel shown
    - no modal is rendered for Formalize/Convert

### 3.3 Files touched
- `packages/client-web/src/ui/interaction/types.ts`
- `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/components/ModalHost.tsx`
- `packages/client-web/test/*` (as above)

## 4) Constraints
- Engine authority (GR-002): Dock must not compute legality/costs; it only groups engine-provided intents.
- PendingChoice gate (GR-006): while pendingChoice exists, normal action session state must be cleared/ignored.
- No auto-commit: variant click must create a draft only; Confirm is explicit.

## 5) Acceptance Criteria
- [ ] Formalize/Convert selection does not open any modal.
- [ ] Variants are shown in the dock only after a valid tile is selected.
- [ ] Variant lists are deterministically ordered (stable grouping + canonical payload order).
- [ ] Confirm/Cancel/Edit remain dock-only.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] ARCH-06 checklist items 1–7 remain satisfied.
- [ ] No new direct commit shortcuts introduced.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
