# Task 0186 — UI: ActionDock unterhalb des Boards + Ghost-Tile Preview deckungsgleich

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0186-ui-dock-under-board-ghost-preview-alignment`
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
* GR-002: Reine Layout-/Rendering-Korrektur in `packages/client-web`. Keine Client-seitige Legalität/Kosten/Mehrheiten, keine neuen Commit-Pfade.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 (YAML): `surfaces.ActionDock.responsibilities.confirm_cancel`
* ARCH-06 Checklist: `10) Visual/UX Minimums` (Preview minimal; valid targets müssen nutzbar sein)

Rule:
* Wenn kein Anchor die Änderung trägt → nicht implementieren.

---

## 2) Goal

* ActionDock blockiert keine Board-Interaktion mehr (kein Overlay über dem Spielfeld); Dock sitzt **im Layoutfluss unterhalb** der Board-Fläche und nutzt **volle Breite** der Center-Column.
* Ghost-Tile Preview ist **pixelgenau deckungsgleich** mit realen Tiles (keine Offsets/Shift durch Flow).
* In Ghost-Preview (und generell) überlappen **Icon** und **Wert/Zahl** nicht; beide sitzen sauber im Innenkreis.

---

## 3) Non-Goals

* Keine Änderungen an LegalIntent-Enumeration, Engine-Legality, Costs oder Moves.
* Keine Änderungen an Interaction-State-Machine, Draft/Confirm Semantik oder PendingChoice-Policies.
* Kein neues Visual-Design; nur Korrektur von Layout/Positionierung.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/components/GameLayout.tsx`
* `packages/client-web/src/components/BoardViewport.tsx` (nur falls Layout-Anker nötig)
* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/components/HexBoard.tsx` (Ghost Preview Wrapper)
* `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
* `packages/client-web/src/index.css`

### Existing behavior summary (current)
* (Bug 1) ActionDock liegt (je nach Viewport/Board) über dem Spielfeld und verdeckt/“frisst” Klicks auf gültige Ziele.
* (Bug 2) Ghost-Tile Preview ist nicht deckungsgleich; Icon und Zahl überlappen sich sichtbar (besonders bei Hover/Preview).

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/components/GameLayout.tsx`
  * Dock-Placement so ändern, dass es **unter** dem BoardViewport liegt (Center-Panel als Column-Layout; Dock am unteren Ende, ohne Overlay).
* `packages/client-web/src/index.css`
  * Dock-Container so stylen, dass er Layoutflow nutzt (kein `position: fixed`/Overlay) und 100% Breite der Board-Column einnimmt.
  * `.ghost-preview` so definieren, dass Preview **absolut** im Ghost-Cell sitzt (`position:absolute; inset:0; display:flex; align/justify:center; pointer-events:none`).
* `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  * Wenn `resortIcon` und `valueW` gleichzeitig gesetzt sind: Y-Positionen so wählen, dass **kein Overlap** entsteht (Icon höher, Wert tiefer), weiterhin zentriert im Innenkreis.

### 5.2 Tests
* Update/Add:
  * `packages/client-web/test/tile-placement-ux.test.tsx`
    * Zusätzliche Assertion: Ghost-Preview wird in `.ghost-preview` gerendert (vorhanden bei Hover).
  * Add (neu, klein & robust):
    * `packages/client-web/test/hex-tile-visual-layout.test.tsx`
      * Rendert `HexTileVisual` mit `resortIcon` + `valueW`.
      * Prüft, dass sowohl Icon-`<g transform=...>` als auch Wert-`<text y=...>` existieren und **nicht dieselben** vertikalen Positionen nutzen (Overlap-Regression abfangen).

### 5.3 Docs
* [x] `/docs/changelog.md` updated — N/A (UI-only, keine Logik/State/Resolver Änderung)
* [x] DD doc — N/A
* [x] ERRATA — N/A

---

## 6) Constraints (Hard)

* UI bleibt presentation-only (GR-002).
* Keine neue Commit-Route; keine `dispatchIntent`/`moves.*`-Calls aus Komponenten.
* Keine neuen user-facing Strings ohne I18N (falls in Touchpoints nötig).

---

## 7) Invariants (Must remain true)

* Determinismus/Golden Replays unverändert (UI-only).
* BoardSurface bleibt klickbar und guided selection bleibt möglich (keine Overlay-Blocker).

---

## 8) Implementation Plan

* [x] Step 1: In `GameLayout.tsx` Dock aus jeder “Overlay”-Positionierung lösen und unterhalb des `BoardViewport` in den Layoutfluss setzen (Center-Panel = flex column; Dock-Container am Ende, volle Breite).
* [x] Step 2: In `index.css` Dock-Container so stylen, dass er nicht über dem Board liegt (`position:relative`, `margin-top:auto`, `width:100%`, `max-width:none` für Dock).
* [x] Step 3: Ghost-Preview Styling: `.ghost-preview` absolut + zentriert; `pointer-events:none`.
* [x] Step 4: In `HexTileVisual.tsx` Icon/Wert-Positionen entkoppeln (nur wenn beide vorhanden) and visuell im Innenkreis halten.
* [x] Step 5: Tests hinzufügen/erweitern (UX Ghost Preview vorhanden; HexTileVisual Layout Regression).
* [x] Step 6: Manuelle Sichtprüfung im Repro (Influence platzieren → Ziele klickbar; Ghost Preview deckungsgleich; kein Overlap Icon/Zahl).

Notes:
* Wenn sich herausstellt, dass das BoardViewport-Layout eine zusätzliche strukturelle Container-Anpassung braucht: nur so viel wie nötig, keine UI-Redesigns.

---

## 9) Acceptance Criteria

* [x] ActionDock liegt unterhalb des Boards (nicht darüber) und blockiert keine Ziel-Klicks mehr.
* [x] Ghost-Tile Preview ist deckungsgleich mit realen Tiles (kein Shift/Offset).
* [x] Icon und Zahl überlappen nicht (Icon + Wert beide sauber im Innenkreis).
* [x] `pnpm -C packages/client-web test` ist grün.

---

## 10) PR Checklist

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] `pnpm lint` passes
* [x] `pnpm -C packages/client-web test` passes
* [x] Determinism verified (golden replay/state hash) — N/A (UI-only), aber keine UI-seitigen RNG/Time Änderungen

---

## 11) Work Summary (3–7 bullets)

* Moved ActionDock from a fixed overlay into the center column layout flow below the BoardViewport in `GameLayout.tsx`.
* Updated `index.css` to make the dock container relative-positioned with full width.
* Implemented `.ghost-preview` styling in `index.css` for pixel-perfect alignment of ghost tiles.
* Adjusted vertical offsets in `HexTileVisual.tsx` to prevent overlap between resort icons and weight values when both are displayed.
* Added `hex-tile-visual-layout.test.tsx` and updated `tile-placement-ux.test.tsx` to verify these UI improvements.

---

## 12) Commands Run (with outcomes)

* `pnpm install`: Success, updated dependencies.
* `pnpm -C packages/client-web test`: Success, all 174 tests passed.
* `pnpm lint`: Success, no linting errors.

---

## 13) Postflight Proof (recorded in commit message)

* <to be filled at COMMIT_READY>

---

## 14) Commit Proof (recorded in commit message)

* <to be filled at COMMIT_READY>

---

## 15) Amendments (append-only)

* (none)
