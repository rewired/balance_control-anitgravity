import type { BadgeSlotId, SeatId } from "./types";

// Source of truth: docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml
// All numeric values are copied verbatim from the YAML contract (no recomputation).

export const VIEWBOX = [0, 0, 747, 864] as const;

export const CENTER_ABS = [373.28624396, 431.625874112] as const;

export const INNER_DISC_RADIUS = 249.99996;

export const INFLUENCE_MARKER_CENTERS_ABS = {
  1: [0.000030165, 215.812893301],
  2: [373.285429344, -0.000480986],
  3: [746.572091316, 215.812893301],
  4: [746.572091316, 647.438467016],
  5: [373.285429344, 863.250666444],
  6: [0.000030165, 647.438467016],
} as const satisfies Readonly<Record<SeatId, readonly [number, number]>>;

export const MARKER_RADIUS = 98.277579;

export const MARKER_STROKE_WIDTH = 37.084447;

export const BADGE_SIZE = [173.73, 101.34] as const;

export const BADGE_CORNER_RADIUS = 24.61;

export const BADGE_SLOTS = {
  compact: [
    { id: "TL_T", center_abs: [220.108281301, 165.949783405], rot_deg: -30.034172325 },
    { id: "T_TR", center_abs: [526.463343061, 165.949860824], rot_deg: 30.034088338 },
  ],
  belt: [
    { id: "TL_T", center_abs: [220.108281301, 165.949783405], rot_deg: -30.034172325 },
    { id: "T_TR", center_abs: [526.463343061, 165.949860824], rot_deg: 30.034088338 },
    { id: "TR_BR", center_abs: [679.572091316, 431.625714971], rot_deg: 90.0 },
    { id: "BR_B", center_abs: [526.463267388, 697.300955694], rot_deg: 149.966046816 },
    { id: "B_BL", center_abs: [220.108356974, 697.301033113], rot_deg: -149.965962829 },
    { id: "BL_TL", center_abs: [67.000030165, 431.625714971], rot_deg: -90.0 },
  ],
} as const satisfies Readonly<{
  compact: ReadonlyArray<{ id: BadgeSlotId; center_abs: readonly [number, number]; rot_deg: number }>;
  belt: ReadonlyArray<{ id: BadgeSlotId; center_abs: readonly [number, number]; rot_deg: number }>;
}>;

export const OVERLAY_RENDER_RECT = {
  x: 0,
  y: 0,
  width: 747,
  height: 864,
  preserveAspectRatio: "none",
} as const;

