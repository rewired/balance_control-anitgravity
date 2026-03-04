

import {
  CENTER_ABS,
  INFLUENCE_MARKER_CENTERS_ABS,
  MARKER_RADIUS,
  MARKER_STROKE_WIDTH,
} from "./tileGeometry";
import type { SeatId } from "./types";

// UI contract: docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml (influence_markers)

const SEATS: readonly SeatId[] = [1, 2, 3, 4, 5, 6] as const;
const STROKE_COLOR = "#000000";
const TEXT_COLOR = "#FFFFFF";

export type InfluenceCornersProps = {
  isHovered: boolean;
  isSelected: boolean;
  influenceBySeat: Partial<Record<SeatId, number>>;
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
  seatColor,
}: InfluenceCornersProps) {
  // Only render influence markers when the tile is hovered or selected
  if (!isHovered && !isSelected) return null;

  const seatsToRender = SEATS.filter((seat) => {
    const influence = influenceBySeat[seat];
    return influence !== undefined && influence > 0;
  });

  if (seatsToRender.length === 0) return null;

  return (
    <g pointerEvents="none">
      {seatsToRender.map((seat) => {
        const [vx, vy] = INFLUENCE_MARKER_CENTERS_ABS[seat];
        const angleDeg = seatAngleDeg(seat);
        const influence = influenceBySeat[seat] ?? 0;

        return (
          <g key={seat} transform={`translate(${vx} ${vy})`}>
            <g transform={`rotate(${angleDeg})`}>
              <circle
                cx={0}
                cy={0}
                r={MARKER_RADIUS}
                fill={seatColor(seat)}
                stroke={STROKE_COLOR}
                strokeWidth={MARKER_STROKE_WIDTH}
                strokeLinejoin="round"
              />
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
            </g>
          </g>
        );
      })}
    </g>
  );
}
