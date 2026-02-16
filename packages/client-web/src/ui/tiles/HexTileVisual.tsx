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
  valueW?: number;
  className?: string;
};

const CONTENT_COLOR = "#FFFFFF";

const DEFAULT_ICON_VIEWBOX_SIZE = 24;
const RESORT_ICON_SIZE = 160;

export function HexTileVisual({
  majoritySeat,
  seatColor,
  isHovered,
  isSelected,
  influenceBySeat,
  metaIconsBySeat,
  badges,
  resortIcon,
  valueW,
  className,
}: HexTileVisualProps) {
  const [cx, cy] = CENTER_ABS;
  const resortIconScale = RESORT_ICON_SIZE / DEFAULT_ICON_VIEWBOX_SIZE;

  const contentLayer =
    resortIcon || valueW !== undefined ? (
      <g style={{ color: CONTENT_COLOR }}>
        {resortIcon ? (
          <g transform={`translate(${cx} ${cy - 60}) scale(${resortIconScale}) translate(${-DEFAULT_ICON_VIEWBOX_SIZE / 2} ${-DEFAULT_ICON_VIEWBOX_SIZE / 2})`}>
            {resortIcon}
          </g>
        ) : null}
        {valueW !== undefined ? (
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={CONTENT_COLOR}
            fontSize={130}
            fontWeight={800}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {valueW}
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
