# Task 0170 — PG-3: Measures group + Expansions→Other fallback (remove “More actions”)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI ActionDock IA (group taxonomy + deterministic ordering)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-check ARCH-06 action taxonomy + determinism rules.
3. [ ] Baseline scans:
   - `rg -n "More actions" packages/client-web/src/components/ActionDock.tsx`
   - `rg -n "MeasureTray" packages/client-web/src/components/ActionDock.tsx`
4. [ ] Baseline tests:
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
- [ ] “More actions” no longer exists; “Expansions → Other” exists.
- [ ] Measures appear only under the Measures group/session (not always-on).
- [ ] All unmapped legal intents appear under Expansions → Other, and selecting them creates a draft.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] ARCH-06 checklist items 1–5 remain satisfied.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
