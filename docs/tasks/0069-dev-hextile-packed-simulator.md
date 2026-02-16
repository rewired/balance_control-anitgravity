# Task 0069 - Dev: HexTile packed simulator page (37 tiles)

Task State: DRAFT

## 0) Guardrails

- MUST comply with: /docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json
- Relevant:
  - GR-002 (Determinism): use fixed seed RNG (mulberry32) for any demo randomness.
  - GR-014 (Client is presentation only): dev UI only.

## 1) Goal

Add a deterministic dev-only view that reproduces the packed hex layout (tiles touch with no gaps) and allows quick QA of:

- overlay blend mode
- icon + value placement
- marker/badge layering

Target: 37 tiles (radius=3), 6 seats.

## 2) Non-goals

- No routing overhaul.
- No production UI changes outside dev routes.

## 3) Inputs

- Existing dev page:
  - /packages/client-web/src/dev/HexTilePlayground.tsx
- Existing viewport (pan/zoom):
  - /packages/client-web/src/components/BoardViewport.tsx
- Existing tile visual:
  - /packages/client-web/src/ui/tiles/HexTileVisual.tsx

## 4) Outputs

A) New dev component

- Add /packages/client-web/src/dev/HexTilePackedSimulator.tsx

Requirements:
- Generate axial coords in radius=3 (37 tiles).
- Convert axial -> pixel using the SAME math as HexBoard.
- Render tiles with absolute positioning so they are edge-to-edge.
- Use `BoardViewport` for pan/zoom.
- Deterministic random demo data (fixed seed).

B) Entry point

- Add a way to reach it from the existing dev playground.
  - Minimal: add a toggle/button in HexTilePlayground to switch between "grid" and "packed".
  - Alternative: add a simple nav link in the dev area (if you already have one).

C) Small self-test

- Add a tiny runtime assertion (dev-only) that nearest neighbor distance is within epsilon.
  - Purpose: catch gaps from accidental size changes.

## 5) Constraints

- ASCII only.
- No new deps.

## 6) Acceptance criteria

- Packed view renders 37 tiles that touch (no visible gaps between neighbors).
- Pan/zoom works.
- Overlay blending stays isolated per tile.

## 7) PR checklist

- [ ] Dev-only; no production behavior changes.
- [ ] Uses deterministic seed.
- [ ] Uses the same axial->pixel math as HexBoard.
- [ ] Easy to access from existing dev UI.

## 8) Suggested commit message

client-web(dev): add packed hex tile simulator (radius=3)
