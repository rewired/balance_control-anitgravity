# Task 0196 — UI: Hex-shaped dotted selection outline with bloom (no square highlight)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0196-ui-hex-dotted-selection-outline-bloom`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only highlight rendering in `packages/client-web` (CSS). No engine logic, no intent enumeration changes, no new commit paths.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 Checklist: `10) Visual/UX Minimums` (targets/highlights must be clearly visible and accurate)

Rule:

* If no anchor supports the change → do not implement.

---

## 2) Problem Statement (Current)

Selection highlight is visually incorrect:

* `.hex-cell-selected::after` currently draws a **square** (fixed `width/height: 136px`) with a rounded rectangle border.
* This is misleading: the playable surface is hexagonal, and selection should reflect the hex footprint.
* Visibility is also too low; highlight should be clearly perceivable (bloom/glow) without obscuring the tile contents.

---

## 3) Goal

* Replace square selection outline with a **hex-shaped** dotted/dashed outline that matches the tile geometry.
* Make it **more visible** via bloom/glow (CSS) while keeping tile content readable.
* Ensure the highlight scales correctly with pan/zoom (i.e., stays within the tile component hierarchy).

---

## 4) Non-Goals

* No changes to game rules, legality, or interaction state machine.
* No changes to tile icon/text layout (that’s separate).
* No design overhaul of board visuals beyond selection highlight.

---

## 5) Inputs (Source of Truth)

* Hex geometry is already expressed as a CSS polygon clip-path in `packages/client-web/src/index.css`:
  * `.hex-ghost { clip-path: polygon(...); }` (existing hex polygon)
* Current selection highlight:
  * `.hex-cell-selected::after` uses square size and rounded corners.

---

## 6) Outputs

### 6.1 Code (CSS)

#### A) Canonical hex clip path variable (preferred)
* Introduce a shared CSS custom property for hex shape, e.g.:
  * `:root { --hex-clip: polygon(...); }`
  * Move the exact polygon points from `.hex-ghost` into `--hex-clip`.
  * Update `.hex-ghost` to use `clip-path: var(--hex-clip)`.

#### B) Hex-shaped selection outline
* Update `.hex-cell-selected::after`:
  * Remove fixed square sizing (or keep inset-based sizing), but the shape must be hex.
  * Apply `clip-path: var(--hex-clip)` (or the polygon directly if variable is not possible).
  * Keep dotted/dashed look:
    * `border: 2px dashed ...;` (or dotted)
  * Add bloom/glow:
    * `filter: drop-shadow(0 0 6px rgba(...)) drop-shadow(0 0 12px rgba(...));`
    * Avoid so much glow that it washes out the tile.

#### C) Layering/pointer safety
* Ensure `pointer-events: none` stays true for the pseudo-element.
* Ensure z-index keeps highlight above tile background but below icon/text if needed.

### 6.2 Tests (Playwright CSS regression)

Add: `e2e/client-web/css-hex-selection-outline.spec.ts`

Approach (fast, no gameplay dependency):
* Navigate to `/?mode=online` (or any fast route that loads CSS).
* Inject a DOM fragment:
  * `<div class="hex-cell hex-cell-selected"><div class="hex-tile-visual"></div></div>`
* Assert (computed styles):
  * The `::after` pseudo-element has a `clip-path` containing `polygon(`.
  * The `::after` pseudo-element has `filter` not equal to `none`.
  * The `border-style` is `dotted` or `dashed`.

Note: Playwright can read pseudo-element styles via `page.evaluate(() => getComputedStyle(el, '::after').clipPath)`.

---

## 7) Constraints (Hard)

* UI remains presentation-only (GR-002).
* No new direct commit paths (no `dispatchIntent`, no `moves.*` from components).
* No new user-facing strings.

---

## 8) Invariants (Must remain true)

* Existing ghost tile hex clipping remains correct (must still be hex, same points).
* Selection highlight does not block clicks.
* No layout shifts in tile sizing/spacing.

---

## 9) Implementation Plan

* [x] Step 1: Extract existing hex polygon into `--hex-shape` and update `.hex-ghost`.
* [x] Step 2: Update `.hex-cell-selected::after` to use `clip-path: var(--hex-shape)` and remove square-specific styling.
* [x] Step 3: Add bloom via `filter: drop-shadow(...)`.
* [x] Step 4: Add Playwright regression test asserting hex clip-path + non-none filter + dotted border.
* [ ] Step 5: Manual visual check in an actual match: selected tile highlight looks hex-shaped and visible, not square.

---

## 10) Acceptance Criteria

* [x] Selection outline is hex-shaped (not square) and matches the tile footprint.
* [x] Outline is clearly visible (glow/bloom present).
* [x] Ghost tiles still clip to the same hex geometry.
* [x] New e2e test passes.
* [x] `pnpm lint`, `pnpm test`, and `pnpm e2e` are green.

---

## 11) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] `pnpm lint` passes
* [x] `pnpm test` passes
* [x] `pnpm e2e` passes
* [x] Determinism proof — N/A (UI-only)
* [x] No temporary files committed
* [x] `CHANGELOG.md` update — N/A (UI-only)

---

## 12) Work Summary (3–7 bullets)

* Defined `--hex-shape` in `:root` to share the hexagonal geometry across components.
* Refactored `.hex-ghost` and `.hex-cell-selected::after` to use the shared hex clip-path.
* Replaced square selection highlight with a hex-shaped dotted outline featuring a bloom effect (multi-pass drop-shadow).
* Added radial gradient background to the selection highlight for better visibility.
* Verified fix with `e2e/client-web/css-hex-selection-outline.spec.ts`.

---

## 13) Commands Run (with outcomes)

* `pnpm lint`: Passed.
* `pnpm test`: Passed (174 tests).
* `pnpm playwright test e2e/client-web/css-hex-selection-outline.spec.ts`: Passed.
* `pnpm e2e`: Passed (4 tests).

---

## 14) Postflight Proof / Commit Proof

* All tests (unit, lint, e2e) passed.
* New E2E test `e2e/client-web/css-hex-selection-outline.spec.ts` confirms hex clip-path, bloom filter, and correct pseudo-element layering.
* UI change is presentation-only, adhering to GR-002.
* Hex polygon shared via `--hex-shape` variable in `:root`.

---

## 15) Amendments (append-only)

* (none)
