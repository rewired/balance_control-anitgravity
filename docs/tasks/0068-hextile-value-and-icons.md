# Task 0068 - HexTile value placement + resort icons (SVG)

Task State: DRAFT

## 0) Guardrails

- MUST comply with: /docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json
- Relevant:
  - GR-002 (Determinism): UI-only.
  - GR-014 (Client is presentation only): no new rules.

## 1) Goal

Align HexTile content visuals with the simulator contract:

1) Produced value (weight) rendering
- If present: centered.
- Positioned 10px above center.
- Font size: 130px.
- Render ONLY the number (no "W" prefix).

2) Resort icons
- Use existing SVG assets for DOM/INF/FOR.
- Render as an SVG `<image>` in the content layer.

## 2) Non-goals

- No new icons for other tile types (Hotspot, Grassroots, etc.) in this task.
- No changes to influence marker rules.

## 3) Inputs

- HexTile visual:
  - /packages/client-web/src/ui/tiles/HexTileVisual.tsx
- Board rendering:
  - /packages/client-web/src/components/HexBoard.tsx
- Existing icon assets:
  - /packages/client-web/src/assets/tile-icons/dom.svg
  - /packages/client-web/src/assets/tile-icons/inf.svg
  - /packages/client-web/src/assets/tile-icons/for.svg

## 4) Outputs

A) HexTileVisual value placement

- Update /packages/client-web/src/ui/tiles/HexTileVisual.tsx
  - Remove the "W" prefix.
  - Move weight text to y = CENTER_ABS[1] - 10.
  - Set font size to 130.

B) Resort icon helper

- Add a tiny helper component, e.g.
  - /packages/client-web/src/ui/tiles/ResortIcon.tsx

Requirements:
- Input: resort string ("DOM" | "INF" | "FOR" | undefined)
- Output: SVG `<image>` node (or null)
- Use Vite URL imports for SVG (no SVGR plugin required).

C) Wire icons into HexBoard

- Update /packages/client-web/src/components/HexBoard.tsx
  - Pass `resortIcon={<ResortIcon resort={tile.resort} />}` to HexTileVisual.

D) Tests

- Extend /packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx with NEW assertions:
  - Value text is centered and shifted up (y = centerY - 10).
  - Value text does not include a "W" prefix.
  - Resort icon `<image>` is present when resort is DOM/INF/FOR.

## 5) Constraints

- ASCII only.
- No asset relocation (use existing paths).

## 6) Acceptance criteria

- Tiles show DOM/INF/FOR icons (not plain text) when resort exists.
- Weight value is centered and readable; matches simulator placement.
- Tests pass.

## 7) PR checklist

- [ ] No new dependencies.
- [ ] No engine changes.
- [ ] Value uses 130px font and y = center - 10.
- [ ] Resort icon mapping only for DOM/INF/FOR.
- [ ] Tests updated and passing.

## 8) Suggested commit message

client-web: center tile weight + add DOM/INF/FOR resort icons
