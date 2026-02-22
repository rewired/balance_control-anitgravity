# Task 0204 — UI: Wire tile icons from assets/tile-icons (committee/grassroots/lobbyist/start/hotspot)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0204-ui-wire-tile-icons-from-assets`
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only icon wiring. No rules/engine changes.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 Checklist: `Icons must be consistent and unambiguous`
* ARCH-05 Documentation Contract: `User-facing meaning should be readable from UI elements` (icons are part of that affordance)

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Inputs (already added to repo by user)

The following SVG files exist under assets in `tile-icons`:

* `committee.svg`
* `grassroots.svg`
* `lobbyist.svg`
* `start-tile.svg`
* `hotspot.svg`

Implementer must confirm the exact path via search:
* `rg -n "tile-icons|committee\\.svg|grassroots\\.svg|lobbyist\\.svg|start-tile\\.svg|hotspot\\.svg" packages docs -S`

Record the final path in PR description.

---

## 3) Goal

Use these SVG assets as the canonical icons for the corresponding tile/concept types across the UI:

* Start tile (Start Committee) → `start-committee.svg`
* Committee → `committee.svg`
* Grassroots → `grassroots.svg`
* Hotspot → `hotspot.svg`
* Lobbyist → `lobbyist.svg`

Icons should appear wherever the UI currently shows a tile-type / concept icon, including (as applicable):
* tile rendering (small corner icon or center icon)
* inspector tile type row
* action group buttons (where a tile-type icon helps recognition)

---

## 4) Non-Goals

* No new icons beyond the 5 listed.
* No visual redesign of tile art itself; these are UI icons.

---

## 5) Implementation Outline

1. **Central mapping (single source of truth)**
   * Add a mapping module, e.g.:
     * `packages/client-web/src/ui/icons/tileIcons.ts` (or existing icon registry)
   * Map semantic keys → imported SVGs:
     * `startTile`, `committee`, `grassroots`, `hotspot`, `lobbyist`

2. **Import strategy (Vite)**
   * Prefer URL imports:
     * `import committeeUrl from ".../committee.svg?url"`
     * Render via `<img src={committeeUrl} ... />`
   * If your pipeline supports ReactComponent SVG imports already, that’s acceptable—be consistent.

3. **Consumers**
   * Replace placeholder icons for these concepts with the mapped SVG.
   * Do not scatter direct asset paths across components.

4. **Sizing + alignment**
   * Standardize a size token (e.g. 18px).
   * Ensure consistent padding and crisp rendering.

5. **Accessibility + i18n**
   * Each icon has an aria-label using i18n keys:
     * `tileIcon.startTile`, `tileIcon.committee`, `tileIcon.grassroots`, `tileIcon.hotspot`, `tileIcon.lobbyist`

---

## 6) Tests

Add a lightweight test (unit/component or e2e) that verifies the mapping loads:

* Render a component that requests each tile icon key
* Assert the `<img>` exists and `src` is non-empty (or the SVG element exists if using ReactComponent)

---

## 7) Constraints

* UI remains presentation-only (GR-002).
* Do not introduce multiple competing icon registries.

---

## Work Summary

* Extended `tileAssets.ts` with `tileIconUrlByType` mapping for Committee, Grassroots, Hotspot, Lobbyist, StartCommittee.
* Created `TileTypeIcon` component to render type icons safely.
* Updated `HexBoard` and `HexTileVisual` to accept and render `typeIcon` (as fallback or primary if resort absent).
* Updated `Tile` component to render icons in header.
* Updated `ActionDock` to show icons on "Formalize" and "Convert" buttons.
* Added i18n keys for tile icons in `en.json` and `de.json`.
* Added `TileIconMapping.test.tsx` to verify mapping integrity.

## Commands Run

* `pnpm test src/ui/tiles/__tests__/TileIconMapping.test.tsx` (Passed)
* `pnpm check:spec-anchors` (Passed)

## Guardrails

* GR-002: Compliant (UI-only presentation changes).
* GR-014: Compliant (Stabilized icon mapping).

## 8) Acceptance Criteria

* [x] The 5 icons are wired from `assets/tile-icons/*.svg` via a central mapping.
* [x] UI uses these icons where tile-type icons are shown.
* [x] i18n/aria labels present.
* [x] Baseline checks green.
