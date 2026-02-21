# Task 0198 — UI: Hex-shaped (not square) selection + target overlays sized from cell vars

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0198-ui-hex-overlays-use-cell-vars`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only overlay rendering (CSS). No engine logic, no commit path changes.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 Checklist: `10) Visual/UX Minimums`

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

Several overlays are still **square** and/or use **hard-coded sizes**:

* `.hex-cell-selected::after` uses `width/height: 136px` and rounded corners.
* `.hex-cell-target::after` / `.hex-cell-target-destination::after` use square boxes and radial fills.

This breaks geometric accuracy and causes visible drift at different zoom levels or if `HEX_SIZE` changes.

We already have per-cell CSS variables in inline styles:
* `--hex-cell-w`
* `--hex-cell-h`

But overlays do not consistently use them.

---

## 3) Goal

* Make selection and target overlays **hex-shaped** and **pointy-top**, using the canonical `--hex-clip`.
* Size overlays from `--hex-cell-w` / `--hex-cell-h` (no fixed pixel dimensions).
* Keep overlays clearly visible (dashed/dotted + bloom), but not content-obscuring.

---

## 4) Non-Goals

* No changes to ghost tile content preview or HexTileVisual internals.
* No changes to action flows (draft/confirm/pending choice).
* No redesign of the tile art.

---

## 5) Outputs

### 5.1 Code (CSS)

In `packages/client-web/src/index.css`:

A) Standardize overlay sizing:

For `.hex-cell-selected::after`, `.hex-cell-target::after`, `.hex-cell-target-destination::after`:

* `width: var(--hex-cell-w);`
* `height: var(--hex-cell-h);`
* `left: 50%; top: 50%; transform: translate(-50%, -50%);`
* `clip-path: var(--hex-clip);`
* Remove `border-radius` and square-only sizing.

B) Keep “dotted/dashed” semantics:

* Selected: `border: 2px dashed rgba(6, 182, 212, 0.8);`
* Targets: `border: 2px dashed rgba(255,255,255,0.35);`
* Destination: border color uses `--active-seat-color`.

C) Bloom/Glow:

* Apply `filter: drop-shadow(...) drop-shadow(...)` for visibility.
* If a radial fill is kept, ensure it’s clipped by `--hex-clip` and not square.

D) Ensure pseudo-elements are click-safe:

* `pointer-events: none;` remains true.

### 5.2 Tests (Playwright CSS regression)

Add: `e2e/client-web/css-hex-overlays-use-cell-vars.spec.ts`

Approach:
* Navigate to `/?mode=online`.
* Inject a `div` with:
  * class `hex-cell hex-cell-selected`
  * inline style `--hex-cell-w: 120px; --hex-cell-h: 140px;`
* Read pseudo-element styles via:
  * `getComputedStyle(el, '::after').width/height` must equal `120px`/`140px`.
  * `getComputedStyle(el, '::after').clipPath` contains `polygon(`.
  * `getComputedStyle(el, '::after').borderStyle` is `dashed` or `dotted`.
* Repeat for a target class (or create a second injected element).

---

## 6) Constraints

* UI remains presentation-only (GR-002).
* No new strings.
* Use `--hex-clip` (do not duplicate polygon values).

---

## 7) Acceptance Criteria

* [ ] Selection and target overlays are hex-shaped (not square) and pointy-top.
* [ ] Overlays size from `--hex-cell-w`/`--hex-cell-h` (no fixed 136px boxes).
* [ ] New e2e tests pass.
* [ ] `pnpm lint`, `pnpm test`, `pnpm e2e` are green.

---
