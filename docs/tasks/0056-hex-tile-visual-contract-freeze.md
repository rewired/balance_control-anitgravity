# /docs/tasks/0056-hex-tile-visual-contract-freeze.md

# Codex Task 0056 - HexTile Visual Contract Freeze (747x864 canonical space)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS
- Client is presentation only: ARCH-01, AGENTS
- State shape consistency: ARCH-02
- Use NPM solutions where useful: AGENTS

---

## Goal

Freeze the HexTile rendering rules as a **normative, machine-readable UI contract** with **exact geometry** in the canonical tile space:

- SVG canonical viewBox: **0 0 747 864** (from `base_tile.svg`)
- Overlay PNG: **748x865** but rendered into **747x864** space (scale)
- Influence marker centers: **exactly on the hex vertices** (not inset)
- Badge slot centers + rotations: **fixed** (no runtime derivation)

This contract must be the single source of truth for later tasks.

---

## Inputs

- `packages/client-web/src/assets/tiles/base_tile.svg` (or source asset to be copied there)
- `packages/client-web/src/assets/tiles/tile-overlay.png` (or source asset to be copied there)

---

## Outputs

Create:

1) `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` (normative)
2) `docs/ui/hex-tile/README.md` (short human-readable summary)
3) `docs/ui/hex-tile/fixtures/base_tile.svg`
4) `docs/ui/hex-tile/fixtures/tile-overlay.png`

The YAML MUST contain (copy exact values below; no recomputation):

```yaml
id: UI-HEX-TILE-VISUAL
version: 0.2
tile_space:
  viewBox: [0, 0, 747, 864]
  center_abs: [373.28624396, 431.625874112]
  inner_disc_radius: 249.99996

layering_bottom_to_top:
  - L0_base_hex_background
  - L1_inner_disc
  - L2_tile_content
  - L3_glass_overlay_png
  - L4_influence_markers
  - L5_badges
  - L6_interaction_states

background_rule:
  no_majority_fill: "#0B0B0D"
  majority_fill: "playerColor(seatId)"
  majority_definition:
    unique_max_required: true
    tie_means_no_majority: true
  apply_to: base_hex_background

influence_marker_centers_abs:
  seat1_TL: [0.000030165, 215.812893301]
  seat2_T:  [373.285429344, -0.000480986]
  seat3_TR: [746.572091316, 215.812893301]
  seat4_BR: [746.572091316, 647.438467016]
  seat5_B:  [373.285429344, 863.250666444]
  seat6_BL: [0.000030165, 647.438467016]

influence_markers:
  visibility:
    show_when:
      - tile.isHovered == true
      - tile.isSelected == true
    otherwise: hidden
  overflow:
    tile_root_overflow: visible
    marker_layer_pointer_events: none
  geometry:
    circle_radius: 98.277579
    circle_stroke: { color: "#000000", width: 37.084447, linecap: round, linejoin: round }
    fill: "playerColor(seatId)"
  content_when_visible:
    show_influence_number: true
    show_all_meta_icons: true
    expand_to_capsule_if_metaCount_gt_0: true
    capsule_width_formula:
      label_gap: 40.0
      icon_size: 86.0
      icon_gap: 22.0
      width: "2*circle_radius + label_gap + metaCount * (icon_size + icon_gap)"

badges:
  mode_rule:
    if_badgeCount_le_2: compact
    if_badgeCount_gt_2: belt
  slot_shape:
    size: [173.73, 101.34]
    corner_radius: 24.61
  inward_offset: 67.0
  belt_slots:
    TL_T:  { center: [220.108281301, 165.949783405], rot_deg: -30.034172325 }
    T_TR:  { center: [526.463343061, 165.949860824], rot_deg:  30.034088338 }
    TR_BR: { center: [679.572091316, 431.625714971], rot_deg:  90.0 }
    BR_B:  { center: [526.463267388, 697.300955694], rot_deg: 149.966046816 }
    B_BL:  { center: [220.108356974, 697.301033113], rot_deg: -149.965962829 }
    BL_TL: { center: [67.000030165, 431.625714971], rot_deg: -90.0 }
  compact_slots_order: [TL_T, T_TR]

overlay_png:
  source_px: [748, 865]
  render_into_tile_space:
    x: 0
    y: 0
    width: 747
    height: 864
    preserveAspectRatio: "none"
  z_layer: L3_glass_overlay_png
  note: "Markers and badges MUST render above overlay."
```

README.md MUST summarize:

- canonical viewBox 747x864 and why
- overlay scaling rule
- hover/selected rule: show influence number + all meta icons
- marker centers are on vertices
- z-order rule (markers/badges above glass)

---

## Constraints

- No engine changes.
- No client legal-move logic.
- ASCII only in docs.

---

## Invariants

- UI spec numbers are exact; later code must reference this spec.
- Marker centers MUST be exactly on the vertices defined above.
- Overlay is always rendered as 747x864 in tile space.

---

## Acceptance Criteria

- YAML + README + fixtures exist at the paths above.
- YAML contains the exact numeric values listed above.
- README is short and unambiguous.

---

## PR Checklist

- [ ] Spec file is normative and machine-readable (no TODOs in normative section)
- [ ] Fixtures copied into docs/ui/hex-tile/fixtures
- [ ] No engine package touched
