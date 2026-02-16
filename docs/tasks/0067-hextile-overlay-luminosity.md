# Task 0067 - HexTile Overlay: mix-blend-mode luminosity @ 0.8 + isolate

Task State: DRAFT

## 0) Guardrails

- MUST comply with: /docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json
- Relevant:
  - GR-002 (Determinism): UI-only change, no engine rule changes.
  - GR-014 (Client is presentation only): no new game logic in client.

## 1) Goal

Make the tile overlay render like Affinity's "Luminanz" blend:

- ONLY: `mix-blend-mode: luminosity`
- Strength fixed at `0.8` (opacity)
- No dark artifacts leaking through alpha
- Blend MUST be isolated to each tile (no interaction with board background)

## 2) Non-goals

- No new overlay modes (no multiply, no two-pass, no filters).
- No engine/state changes.

## 3) Inputs

- Current tile stack is composed in:
  - /packages/client-web/src/ui/tiles/HexTileVisual.tsx
  - /packages/client-web/src/ui/tiles/HexTileFrame.tsx
  - /packages/client-web/src/ui/tiles/GlassOverlay.tsx
- Asset:
  - /packages/client-web/src/assets/tiles/tile-overlay.png

## 4) Outputs

A) Overlay rendering

- Update /packages/client-web/src/ui/tiles/GlassOverlay.tsx
  - Apply `mixBlendMode: 'luminosity'`.
  - Apply `opacity: 0.8`.
  - Keep `preserveAspectRatio="none"`.
  - Keep `pointerEvents="none"`.

B) Isolation / stacking context

- Ensure each tile is an isolated blending context.
  - Preferred: CSS `isolation: isolate` on `.hex-cell` and/or `.hex-tile-visual`.
  - Location: /packages/client-web/src/index.css (or wherever `.hex-cell` is defined).

C) Tests

- Extend /packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx with NEW assertions:
  - The overlay `<image>` has `style` containing `mix-blend-mode: luminosity`.
  - The overlay `<image>` has opacity 0.8 (attribute or inline style).

## 5) Constraints

- ASCII only.
- Determinism: no RNG, no Date.now, no window-dependent logic.
- Do not change the tile geometry constants.

## 6) Acceptance criteria

- On the board, enabling the overlay does NOT create dark blotches in semi-transparent regions.
- Overlay visually matches: "luminosity" blend at ~80% strength.
- Smoke tests pass.

## 7) PR checklist

- [ ] No engine changes.
- [ ] Overlay uses ONLY mix-blend-mode: luminosity.
- [ ] Overlay strength is fixed at 0.8.
- [ ] Each tile blends in isolation.
- [ ] Tests updated and passing.

## 8) Suggested commit message

client-web: tile overlay luminosity blend at 0.8 (isolated)
