# Task 0197 — UI: Canonical pointy-top hex clip path (align visuals with axial layout)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0197-ui-canonical-pointy-hex-clip`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** COMPLETED

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only CSS geometry fix. No engine changes, no legality logic, no commit path changes.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 Checklist: `10) Visual/UX Minimums` (highlights/targets must be accurate)

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

The board coordinate system uses **pointy-top** axial layout:

* `axialToPixel()` is explicitly documented and implemented as pointy-top.

However, UI overlays use a **flat-top** clip-path polygon (e.g. `.hex-ghost { clip-path: polygon(25% 5%, 75% 5%, ... ) }`),
which makes ghost tiles / outlines look rotated and “not sitting on the tip”.

This mismatch causes:
* Perceived misalignment of ghost tiles and selection/target highlights.
* Dotted outline appears “wrong” relative to the base hex art / grid.

---

## 3) Goal

* Define a **canonical pointy-top** hex polygon clip-path and use it everywhere we clip/highlight hex geometry.
* Eliminate flat-top vs pointy-top mismatch so ghosts/highlights visually align with the board.

---

## 4) Non-Goals

* No changes to axial math, board spacing, or coordinate conversions.
* No changes to tile art, icon/text layout, or action logic.

---

## 5) Outputs

### 5.1 Code (CSS)

In `packages/client-web/src/index.css`:

A) Introduce a canonical clip-path variable (single source of truth):

* `:root { --hex-clip: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); }`

B) Replace any existing flat-top polygons with `var(--hex-clip)`:

* `.hex-ghost { clip-path: var(--hex-clip); }`
* Any other hex clipping used for overlays (search `clip-path: polygon(`) should use the variable.

C) Remove conflicting rounded-rect cues on clipped elements:

* For clipped hex overlays (ghost/outline), avoid `border-radius` unless it is purely cosmetic and does not fight the hex silhouette.

### 5.2 Tests (Playwright CSS regression)

Add: `e2e/client-web/css-canonical-hex-clip-pointy.spec.ts`

Approach:
* Navigate to `/?mode=online` (fast route; CSS loaded).
* Inject an element with class `hex-ghost`.
* Assert `getComputedStyle(el).clipPath` contains the expected **pointy-top** polygon string:
  * contains `polygon(` and begins with `50% 0%` (or equivalent computed form).

Note: keep the assertion resilient (substring checks), because browsers may normalize whitespace.

---

## 6) Constraints

* UI remains presentation-only (GR-002).
* No new user-facing strings.
* Do not introduce duplicated polygons in multiple selectors.

---

## 7) Acceptance Criteria

* [x] `--hex-clip` exists and is pointy-top.
* [x] `.hex-ghost` uses `clip-path: var(--hex-clip)` and no longer uses a flat-top polygon.
* [x] The new e2e test passes.
* [x] `pnpm lint`, `pnpm test`, `pnpm e2e` are green.

---
