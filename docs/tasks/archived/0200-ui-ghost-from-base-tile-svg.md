# Task 0200 — UI: Ghost tiles derive geometry from base-tile.svg (no CSS polygon drift)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0200-ui-ghost-from-base-tile-svg`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only rendering change in `packages/client-web`. No engine logic, no intent enumeration changes, no commit path changes.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 Checklist: `10) Visual/UX Minimums` (targets/ghosts/highlights must be accurate and clearly visible)

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

Ghost tiles are still visibly misaligned relative to the base tile (orientation + outline). Current approach relies on CSS `clip-path: polygon(...)`,
which is prone to drift and does not guarantee the exact same hex outline as the base tile art.

We already have a canonical visual asset: **`base-tile.svg`** (the source of truth for the tile silhouette). Ghosts should be derived from it.

---

## 3) Goal

* Render ghost tiles using geometry extracted from `base-tile.svg` so the ghost outline matches the base tile exactly.
* Remove dependence on hand-authored CSS polygon points for ghost silhouettes.
* Keep interaction behavior unchanged: ghost tiles remain click targets, preview stays pointer-safe.

---

## 4) Non-Goals

* No changes to axial math / board placement / spacing.
* No redesign of base tile art.
* No changes to action flows (draft/confirm/pending choice).

---

## 5) Inputs (Repo Discovery)

Implementer must locate the canonical asset path via search:

* `rg -n "base-tile\.svg|baseTile\.svg|base_tile\.svg" packages/client-web packages/ui packages/assets docs -S`

Then record the discovered path in the PR description and (optionally) in this task’s Work Summary.

---

## 6) Output Design (Preferred Implementation)

### 6.1 Introduce a reusable HexSilhouette component (SVG-driven)

Create in `packages/client-web/src/components/`:

* `HexSilhouette.tsx` (or equivalent)

Responsibilities:
* Import the `base-tile.svg` (as URL or React component, depending on your bundler setup).
* Extract or reference the **exact hex outline**:
  * Preferred: use an explicit `<path id="hex-outline" ...>` or `<polygon id="hex-outline" ...>` from the SVG.
  * If the SVG does not have an outline element, add a minimal, non-visual outline element inside the SVG asset itself (see 6.3).
* Expose the outline as:
  * (A) `<svg><defs><clipPath id=...>...</clipPath></defs></svg>` to be referenced by ghost layers
  * or (B) an inline `<svg>` used directly as the ghost overlay (stroke + fill)

Constraints:
* `pointer-events: none` for non-interactive SVG layers.
* Keep it resolution-independent (scale via `width/height: 100%`).

### 6.2 Ghost tile rendering change

Update the ghost tile render path (likely in `HexBoard.tsx` or wherever ghost cells are produced):

Option A (clipPath):
* Ghost remains a `<button class="hex-cell hex-ghost">`
* Add a child wrapper that uses the SVG clipPath:
  * A child `<svg>` defines `clipPath` and ghost content is clipped inside it.
* Remove CSS `clip-path` usage for ghosts (or leave as fallback behind a feature flag, but default must be SVG-driven).

Option B (direct SVG outline):
* Render an SVG overlay that draws the hex outline (from base-tile outline) with:
  * dashed/dotted stroke
  * glow via `filter: drop-shadow(...)`
* The filled ghost background can remain a div underneath if desired, but the silhouette must match base-tile.

### 6.3 If base-tile.svg lacks a clean outline element

Make a minimal edit to the asset (preferred over re-deriving with math):

* Add an explicit, non-rendering outline element:
  * `<path id="hex-outline" d="..." fill="none" />`
* Do not change visible rendering of the base tile (no stroke/fill modifications to existing visible shapes).
* This outline becomes the canonical clip/reference for all overlays.

---

## 7) What to remove / deprecate

* Deprecate the CSS polygon used for ghost silhouette:
  * `.hex-ghost { clip-path: polygon(...); }` should be removed or demoted to fallback (not primary).
* Avoid duplicating geometry in CSS variables for this path going forward (SVG is canonical).

---

## 8) Tests (E2E / Regression)

Add: `e2e/client-web/ghost-uses-base-tile-svg-outline.spec.ts`

Approach (fast, no gameplay dependency):
* Navigate to `/?mode=online` (CSS + assets load).
* Inject a minimal ghost DOM structure that uses the new component (or a test harness route if exists).
* Assert:
  * An SVG element exists under `.hex-ghost` (or the clipPath defs exist in DOM).
  * The SVG includes an element with `id="hex-outline"` (or known selector).
  * The ghost no longer relies on CSS `clip-path: polygon(` (optional check: computedStyle.clipPath is `none` or not polygon-based).

Note: Keep assertions resilient; do not hardcode full path strings if avoidable.

---

## 9) Constraints

* UI remains presentation-only (GR-002).
* No new user-facing strings.
* No new commit paths / direct engine calls from UI.
* Keep performance reasonable: reuse defs where possible; do not create hundreds of unique clipPath IDs per frame.

---

## 10) Acceptance Criteria

* [x] Ghost tile silhouette matches the base tile outline (no visible rotation/offset mismatch).
* [x] Ghost rendering uses `base-tile.svg` outline as the source of truth.
* [x] CSS polygon ghost clip is removed or not the primary mechanism.
* [x] New e2e regression test passes.
* [x] `pnpm lint`, `pnpm test`, and `pnpm e2e` are green.

---

## 11) PR Checklist

* [x] Repo search proof included (found base_tile.svg at `packages/client-web/src/assets/tiles/base_tile.svg`)
* [x] No rule/engine changes
* [x] Performance considered (defs reused via global `HexSilhouette` in `App.tsx`)
* [x] Tests added and green

---

## 12) Work Summary / Proof

* Found canonical asset: `packages/client-web/src/assets/tiles/base_tile.svg`.
* Updated `base_tile.svg` path with `id="hex-outline"` for identification.
* Created `HexSilhouette.tsx` component providing a global `clipPath` (`#hex-outline-clip`) based on normalized asset geometry.
* Created `HexOutline.tsx` (in the same file) for rendering SVG stroke outlines.
* Integrated `HexSilhouette` into `App.tsx` global layout to ensure clip availability.
* Updated `HexBoard.tsx` ghost rendering to use SVG clipPath and `HexOutline`.
* Standardized all hex overlays (selection, target, destination) in `index.css` to use the SVG clipPath.
* Removed deprecated `--hex-clip` CSS variable.
* Added `e2e/client-web/ghost-uses-base-tile-svg-outline.spec.ts` and updated existing E2E tests.
* Verified all checks (`lint`, `test`, `build`, `e2e`) pass.
