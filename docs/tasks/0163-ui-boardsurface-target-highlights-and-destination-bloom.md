# Task 0163 — PG-2: BoardSurface target highlighting + destination-step player-color bloom

Status: DRAFT

## Meta
- Owner: Codex
- Area: BoardSurface guided selection (visual affordances)
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-005

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Read `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` and `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`.
3. [ ] Baseline scan (no edits yet):
   - `grep -RIn "hex-cell-target" packages/client-web/src` (should find class usage but no CSS)
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Add the **minimum required visual affordances** for guided selection:
- Valid board targets are visibly highlighted.
- When choosing a **destination step** (MoveInfluence after a source is pinned), valid destinations get a subtle **active-player-color bloom**.

No interaction semantics change in this task (purely visual + prop plumbing).

## 2) Inputs
- Normative UX requirements:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Section 10)
- Board components:
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/GameLayout.tsx` (prop wiring only)
- Styles:
  - `packages/client-web/src/index.css`

## 3) Outputs
### 3.1 Code
- `HexBoard` applies explicit classes/attributes for guided-selection states:
  - `hex-cell-target` for any valid selectable tile (source/target)
  - `hex-cell-target-destination` for MoveInfluence destination step only
- `GameLayout` passes active player seat (or a CSS color token) down to `HexBoard` so CSS can implement seat-colored bloom.
  - Keep this presentation-only; do not compute legality.

### 3.2 CSS
- Add styles to `index.css`:
  - `.hex-cell-target::after` highlight ring (subtle, non-distracting)
  - `.hex-cell-target-destination::after` bloom using active player seat color
  - Ensure these styles do **not** override `.hex-cell-selected` (selected must remain the strongest signal).

### 3.3 Tests
- Add/adjust a focused unit test:
  - `packages/client-web/test/Board.test.tsx` (or a new `hex-target-highlights.test.tsx`)
  - Assert that when `actionMode="placeInfluence"` and an intent exists for a tile, the rendered tile element has `hex-cell-target`.
  - For MoveInfluence destination step, assert that valid destination tiles get `hex-cell-target-destination` when `moveInfluenceSourceId` is provided.

## 4) Constraints
- Presentation-only (GR-002): no legality computation; use the already-provided legal intent lists.
- No phantom moves (GR-005): no new action modes beyond what already exists; this task is only visuals.
- Determinism: no time-based animation logic; CSS-only.

## 5) Acceptance Criteria
- [ ] Valid targets are visually distinguished on the board (CSS class present + visible effect).
- [ ] Destination-step bloom uses the active player's seat color.
- [ ] Existing tests stay green: `pnpm -C packages/client-web test`.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/GR-005).
- [ ] No engine/rule/spec changes.
- [ ] No new commit path introduced.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- TBD

## 8) Commands Run
- TBD
