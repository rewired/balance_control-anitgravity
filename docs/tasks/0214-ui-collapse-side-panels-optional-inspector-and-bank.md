# Task 0214 — PG-7: Make side panels optional (collapse by default; dock toggles)

Status: DRAFT

## Meta
- Owner: Codex
- Area: Screen density / progressive disclosure
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006, GR-014

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Baseline scan (no edits yet):
   - `rg -n "left-panel|right-panel|inspector-panel|draw-bag-widget" packages/client-web/src/components/GameLayout.tsx`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Reduce clutter: side information should not dominate the play experience.
- Left panel (players/resources) and right panel (inspector/decks) are **collapsible**.
- Default state: **collapsed** (board + dock are the focus).
- Panels can be toggled quickly from the dock (single click).

## 2) Inputs
- Layout:
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/index.css`
- Dock:
  - `packages/client-web/src/components/ActionDock.tsx` (toggle controls live here)
- Inspector:
  - `packages/client-web/src/components/InspectorActionStatus.tsx`

## 3) Outputs
### 3.1 Code
- Add local UI state (component state) controlling visibility:
  - `showLeftPanel`, `showRightPanel`
  - Persist best-effort via `localStorage` (UI-only; no engine state).
- Provide dock toggles:
  - “Players” (left)
  - “Inspector” (right)
  - Keep them small (icon + label is fine).
- Collapsed mode behavior:
  - Panels become hidden (no width) OR minimal icon rail (optional).
  - Board column grows to use the freed space.
- Ensure accessibility:
  - toggles are keyboard reachable
  - visible focus styles
- If iconography is touched, respect GR-014 (stable icon mapping). Do not remap tile icons in this task.

### 3.2 Tests
- Add/update one UI test:
  - Collapsed by default.
  - Toggle shows/hides panels.
  - Board + dock remain present.

### 3.3 Files touched
- `packages/client-web/src/components/GameLayout.tsx`
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/index.css`
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- Engine authority (GR-002): UI state only; never stored in `G` or derived as “rules”.
- No phantom moves (GR-005): toggles must not dispatch intents.
- Pending choice gate (GR-006): toggles must not break hard-gate semantics.
- GR-014 (UI icon stability): do not change tile-type ↔ icon mapping.

## 5) Acceptance Criteria
- [ ] Left + right panels are collapsed by default.
- [ ] User can toggle panels from the dock instantly.
- [ ] Board space increases when panels are collapsed.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006/014).
- [ ] No engine/rule/spec changes.
- [ ] No new commit shortcuts / auto-commit.
- [ ] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- TBD (append-only)

## 8) Commands Run
- TBD (append-only)
