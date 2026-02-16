# UI-HEX-TILE-VISUAL (v0.2)

Normative UI contract for HexTile rendering in canonical tile space.

## Canonical space

* SVG viewBox is fixed at `0 0 747 864` and is the canonical coordinate space.
* The overlay PNG is `748x865` source pixels, but MUST be rendered into `747x864` tile space via scaling (preserveAspectRatio: none).

## Influence markers

* Marker centers are EXACTLY on the hex vertices defined in `UI-HEX-TILE-VISUAL.v0.2.yaml` (not inset).
* Show influence number + all meta icons when `tile.isHovered == true` OR `tile.isSelected == true`; otherwise hidden.

## Badges

* Badge slot centers + rotations are fixed as listed in `UI-HEX-TILE-VISUAL.v0.2.yaml` (no runtime derivation).

## Z-order

* Markers and badges MUST render above the glass overlay PNG.
