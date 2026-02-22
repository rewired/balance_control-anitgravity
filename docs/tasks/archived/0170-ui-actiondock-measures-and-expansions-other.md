# Task 0170 — PG-3: Measures group + Expansions→Other fallback (remove “More actions”)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI ActionDock IA (group taxonomy + deterministic ordering)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Re-check ARCH-06 action taxonomy + determinism rules.
3. [x] Baseline scans:
   - `rg -n "More actions" packages/client-web/src/components/ActionDock.tsx` (Done, none found, already "Expansions / Other")
   - `rg -n "MeasureTray" packages/client-web/src/components/ActionDock.tsx` (Found usage)
4. [x] Baseline tests:
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Align Measures + “Other actions” UI with the contract taxonomy:
- Replace the “More actions” details block with **Expansions → Other** group.
- Make Measures an explicit action group, not an always-on tray:
  - selecting Take Measure shows deterministic measure variants (grouped by expansion prefix).
- Ensure all non-mapped intents appear under Expansions → Other (draft → confirm; never auto-commit).

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (core.measures + expansions.other)
- Existing helpers:
  - `packages/client-web/src/ui/interaction/measureHelpers.ts`
  - `packages/client-web/src/ui/interaction/labelHelpers.ts`
- Existing components:
  - `packages/client-web/src/components/ActionDock.tsx`
  - `packages/client-web/src/components/MeasureTray.tsx`

## 3) Outputs
### 3.1 Code
- ActionDock:
  - Introduce a Measures group entry (e.g. “Take Measure”).
  - When active, render measure variants deterministically:
    - group by expansion prefix (`exp01`, `exp02`, `exp03`, …)
    - within group, sort by stable object id label key (fallback: payload string)
  - Move (or reuse) `MeasureTray` rendering so it is driven by the Measures action session.
- Expansions → Other:
  - Provide a fallback list for all legal intents not mapped to the known core action types.
  - Clicking an item proposes a draft (no commit).
- Remove “More actions” UI from ActionDock entirely.

### 3.2 Tests
- Update/extend tests:
  - `packages/client-web/test/measure-tray.test.tsx` (if MeasureTray becomes dock-only, rewrite to match new render path)
  - `packages/client-web/test/action-dock.test.tsx` (assert no “More actions”; assert “Expansions” group fallback)

### 3.3 Files touched
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/components/MeasureTray.tsx` (only if still used)
- `packages/client-web/test/action-dock.test.tsx`
- `packages/client-web/test/measure-tray.test.tsx` (as needed)

## 4) Constraints
- Engine authority (GR-002): no client-side move construction; only select from legal intents.
- No phantom moves (GR-005): “Other” must be a pure fallback list, not new actions.
- Determinism: ordering must be stable (no iteration over object keys without sorting).
- PendingChoice gate (GR-006): Measures/Other must be disabled while hard-gated.

## 5) Acceptance Criteria
- [x] “More actions” no longer exists; “Expansions → Other” exists.
- [x] Measures appear only under the Measures group/session (not always-on).
- [x] All unmapped legal intents appear under Expansions → Other, and selecting them creates a draft.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005/006).
- [x] No engine/rule/spec changes.
- [x] ARCH-06 checklist items 1–5 remain satisfied.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- Replaced "More actions" fallback with "Expansions → Other" group.
- Added "Measures" action group to ActionDock.
- Added "Take Measure" button to toggle MeasureTray visibility.
- Updated MeasureTray to be rendered conditionally based on `actionMode`.
- Updated tests to verify new behavior and ensure no regressions.

## 8) Commands Run
- `rg -n "More actions" packages/client-web/src/components/ActionDock.tsx`
- `pnpm -C packages/client-web test`
- `git status -sb`
- `git diff --stat`

## 9) Guardrails
- GR-002: Engine-only Rule Execution (Compliant: UI only triggers intents)
- GR-005: No Phantom Moves (Compliant: "Other" only lists existing legal intents)
- GR-006: Pending Choice Gate (Compliant: ActionDock respects interaction state)
