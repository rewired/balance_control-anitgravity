import type { ReactNode } from "react";

import {
  CENTER_ABS,
  INFLUENCE_CAPSULE_LABEL_GAP,
  INFLUENCE_MARKER_CENTERS_ABS,
  INFLUENCE_META_ICON_GAP,
  INFLUENCE_META_ICON_SIZE,
  MARKER_RADIUS,
  MARKER_STROKE_WIDTH,
} from "./tileGeometry";
import type { SeatId } from "./types";

// UI contract: docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml (influence_markers)

const SEATS: readonly SeatId[] = [1, 2, 3, 4, 5, 6] as const;
const STROKE_COLOR = "#000000";
const TEXT_COLOR = "#FFFFFF";
const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export type InfluenceCornersProps = {
  isHovered: boolean;
  isSelected: boolean;
  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, ReactNode[]>>;
  seatColor: (seat: SeatId) => string;
};

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function seatAngleDeg(seat: SeatId) {
  const [cx, cy] = CENTER_ABS;
  const [vx, vy] = INFLUENCE_MARKER_CENTERS_ABS[seat];
  return toDeg(Math.atan2(vy - cy, vx - cx));
}

export function InfluenceCorners({
  isHovered,
  isSelected,
  influenceBySeat,
  metaIconsBySeat,
  seatColor,
}: InfluenceCornersProps) {
  const isVisible = isHovered || isSelected;
  if (!isVisible) return null;

  const seatsToRender = SEATS.filter((seat) => {
    const influence = influenceBySeat[seat];
    const metaIcons = metaIconsBySeat[seat] ?? [];
    return influence !== undefined || metaIcons.length > 0;
  });

  if (seatsToRender.length === 0) return null;

  return (
    <g pointerEvents="none">
      {seatsToRender.map((seat) => {
        const [vx, vy] = INFLUENCE_MARKER_CENTERS_ABS[seat];
        const angleDeg = seatAngleDeg(seat);

        const influence = influenceBySeat[seat] ?? 0;
        const metaIcons = metaIconsBySeat[seat] ?? [];
        const metaCount = metaIcons.length;

        const capsuleExtra =
          INFLUENCE_CAPSULE_LABEL_GAP + metaCount * (INFLUENCE_META_ICON_SIZE + INFLUENCE_META_ICON_GAP);
        const capsuleWidth = 2 * MARKER_RADIUS + capsuleExtra;
        const capsuleHeight = 2 * MARKER_RADIUS;

        const iconScale = INFLUENCE_META_ICON_SIZE / DEFAULT_ICON_VIEWBOX_SIZE;
        const iconFirstCenterX = MARKER_RADIUS + INFLUENCE_CAPSULE_LABEL_GAP + INFLUENCE_META_ICON_SIZE / 2;

        return (
          <g key={seat} transform={`translate(${vx} ${vy})`}>
            <g transform={`rotate(${angleDeg})`}>
              {metaCount > 0 ? (
                <rect
                  x={-MARKER_RADIUS}
                  y={-MARKER_RADIUS}
                  width={capsuleWidth}
                  height={capsuleHeight}
                  rx={MARKER_RADIUS}
                  ry={MARKER_RADIUS}
                  fill={seatColor(seat)}
                  stroke={STROKE_COLOR}
                  strokeWidth={MARKER_STROKE_WIDTH}
                  strokeLinejoin="round"
                />
              ) : (
                <circle
                  cx={0}
                  cy={0}
                  r={MARKER_RADIUS}
                  fill={seatColor(seat)}
                  stroke={STROKE_COLOR}
                  strokeWidth={MARKER_STROKE_WIDTH}
                  strokeLinejoin="round"
                />
              )}

              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={TEXT_COLOR}
                fontSize={64}
                fontWeight={700}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {influence}
              </text>

              {metaIcons.map((icon, idx) => {
                const x = iconFirstCenterX + idx * (INFLUENCE_META_ICON_SIZE + INFLUENCE_META_ICON_GAP);
                return (
                  <g
                    key={`seat${seat}-meta${idx}`}
                    transform={`translate(${x} 0) scale(${iconScale}) translate(${-DEFAULT_ICON_VIEWBOX_SIZE / 2} ${
                      -DEFAULT_ICON_VIEWBOX_SIZE / 2
                    })`}
                    style={{ color: TEXT_COLOR }}
                  >
                    {icon}
                  </g>
                );
              })}
            </g>
          </g>
        );
      })}
    </g>
  );
}
