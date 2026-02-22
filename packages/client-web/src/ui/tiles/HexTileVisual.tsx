import type { ReactNode } from "react";

import { BadgeSlots } from "./BadgeSlots";
import { HexTileFrame } from "./HexTileFrame";
import { InfluenceCorners } from "./InfluenceCorners";
import { CENTER_ABS } from "./tileGeometry";
import type { SeatId, TileBadge } from "./types";

export type HexTileVisualProps = {
  majoritySeat: SeatId | null;
  seatColor: (seat: SeatId) => string;

  isHovered: boolean;
  isSelected: boolean;

  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, ReactNode[]>>;

  badges: TileBadge[];

  resortIcon?: ReactNode;
  typeIcon?: ReactNode;
  typeTag?: string;
  valueW?: number;
  className?: string;
};

const CONTENT_COLOR = "#FFFFFF";

const DEFAULT_ICON_VIEWBOX_SIZE = 24;
const RESORT_ICON_SIZE = 160;

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export function HexTileVisual({
  majoritySeat,
  seatColor,
  isHovered,
  isSelected,
  influenceBySeat,
  metaIconsBySeat,
  badges,
  resortIcon,
  typeIcon,
  typeTag,
  valueW,
  className,
}: HexTileVisualProps) {
  const [cx, cy] = CENTER_ABS;
  const resortIconScale = RESORT_ICON_SIZE / DEFAULT_ICON_VIEWBOX_SIZE;

  // Prefer resortIcon if both are present (though usually mutually exclusive)
  const activeIcon = resortIcon || typeIcon;

  const hasValue = valueW !== undefined;
  const hasTag = typeTag !== undefined;

  // Layout logic:
  // If we have both icon and value (e.g. Resort with weight), shift icon up and value down.
  // If we have both icon and tag (e.g. Typed Grassroots), shift icon up and tag down.
  // Otherwise center the single item.

  const hasSecondary = hasValue || hasTag;
  const hasBoth = activeIcon && hasSecondary;

  const iconOffset = hasBoth ? -115 : -60;
  const secondaryOffset = hasBoth ? 85 : -10;

  const contentLayer =
    activeIcon || hasSecondary ? (
      <g style={{ color: CONTENT_COLOR }}>
        {activeIcon ? (
          <g transform={`translate(${cx} ${cy + iconOffset}) scale(${resortIconScale}) translate(${-DEFAULT_ICON_VIEWBOX_SIZE / 2} ${-DEFAULT_ICON_VIEWBOX_SIZE / 2})`}>
            {activeIcon}
          </g>
        ) : null}

        {hasValue ? (
          <text
            x={cx}
            y={cy + secondaryOffset}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={CONTENT_COLOR}
            fontSize={130}
            fontWeight={800}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {valueW}
          </text>
        ) : hasTag ? (
           <text
            x={cx}
            y={cy + secondaryOffset}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={CONTENT_COLOR}
            fontSize={60}
            fontWeight={700}
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
          >
            {typeTag}
          </text>
        ) : null}
      </g>
    ) : undefined;

  return (
    <HexTileFrame
      majoritySeat={majoritySeat}
      seatColor={seatColor}
      className={className}
      svgProps={{
        "data-component": "HexTileVisual",
        "data-hovered": isHovered ? "1" : "0",
        "data-selected": isSelected ? "1" : "0",
      }}
      content={contentLayer}
    >
      <InfluenceCorners
        isHovered={isHovered}
        isSelected={isSelected}
        influenceBySeat={influenceBySeat}
        metaIconsBySeat={metaIconsBySeat}
        seatColor={seatColor}
      />
      <BadgeSlots badges={badges} />
    </HexTileFrame>
  );
}
