import type { ReactNode } from "react";

import { BADGE_CORNER_RADIUS, BADGE_SIZE, BADGE_SLOTS } from "./tileGeometry";
import type { TileBadge, TileBadgeTone } from "./types";

// UI contract: docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml (badges)

export type BadgeSlotsProps = {
  badges: TileBadge[];
  isHovered?: boolean;
  isSelected?: boolean;
};

const STROKE_COLOR = "#000000";
const STROKE_WIDTH = 10;
const ICON_COLOR = "#FFFFFF";

const DEFAULT_ICON_VIEWBOX_SIZE = 24;
const BADGE_ICON_SIZE = 64;

const TONE_FILL: Record<TileBadgeTone, string> = {
  neutral: "#1B1B22",
  warn: "#5A4B00",
  danger: "#5A0A0A",
};

function badgeFill(tone: TileBadgeTone | undefined) {
  return TONE_FILL[tone ?? "neutral"];
}

export function BadgeSlots({ badges }: BadgeSlotsProps) {
  if (badges.length === 0) return null;

  const slotDefs = badges.length <= 2 ? BADGE_SLOTS.compact : BADGE_SLOTS.belt;
  const count = Math.min(badges.length, slotDefs.length);

  const [badgeW, badgeH] = BADGE_SIZE;
  const iconScale = BADGE_ICON_SIZE / DEFAULT_ICON_VIEWBOX_SIZE;

  return (
    <g>
      {slotDefs.slice(0, count).map((slot, idx) => {
        const badge = badges[idx] as TileBadge;
        const [cx, cy] = slot.center_abs;

        return (
          <g key={`${slot.id}:${badge.key}`} transform={`translate(${cx} ${cy})`}>
            <g transform={`rotate(${slot.rot_deg})`}>
              <rect
                x={-badgeW / 2}
                y={-badgeH / 2}
                width={badgeW}
                height={badgeH}
                rx={BADGE_CORNER_RADIUS}
                ry={BADGE_CORNER_RADIUS}
                fill={badgeFill(badge.tone)}
                stroke={STROKE_COLOR}
                strokeWidth={STROKE_WIDTH}
                strokeLinejoin="round"
              />
              <g style={{ color: ICON_COLOR }}>
                <g transform={`scale(${iconScale})`}>
                  <g transform={`translate(${-DEFAULT_ICON_VIEWBOX_SIZE / 2} ${-DEFAULT_ICON_VIEWBOX_SIZE / 2})`}>
                    {badge.icon as ReactNode}
                  </g>
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

