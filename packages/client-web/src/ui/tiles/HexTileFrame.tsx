import type { ReactNode, SVGProps } from "react";

import { GlassOverlay } from "./GlassOverlay";
import { CENTER_ABS, INFLUENCE_MARKER_CENTERS_ABS, INNER_DISC_RADIUS, VIEWBOX } from "./tileGeometry";
import type { SeatId } from "./types";

export type HexTileFrameProps = {
  majoritySeat: SeatId | null;
  seatColor: (seat: SeatId) => string;
  className?: string;
  svgProps?: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox" | "xmlns">;
  content?: ReactNode;
  children?: ReactNode;
};

const NO_MAJORITY_FILL = "#0B0B0D";
const INNER_DISC_FILL = "#141419";

const BASE_OUTLINE_COLOR = "#000000";
const BASE_OUTLINE_WIDTH = 14;

const INNER_DISC_OUTLINE_COLOR = "#000000";
const INNER_DISC_OUTLINE_WIDTH = 10;

function viewBoxToString(vb: readonly [number, number, number, number]) {
  return `${vb[0]} ${vb[1]} ${vb[2]} ${vb[3]}`;
}

function hexPathFromVerticesAbs(vertices: Readonly<Record<SeatId, readonly [number, number]>>) {
  const [x2, y2] = vertices[2];
  const [x3, y3] = vertices[3];
  const [x4, y4] = vertices[4];
  const [x5, y5] = vertices[5];
  const [x6, y6] = vertices[6];
  const [x1, y1] = vertices[1];

  return `M ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} L ${x5} ${y5} L ${x6} ${y6} L ${x1} ${y1} Z`;
}

export function HexTileFrame({ majoritySeat, seatColor, className, svgProps, content, children }: HexTileFrameProps) {
  const baseFill = majoritySeat === null ? NO_MAJORITY_FILL : seatColor(majoritySeat);
  const hexPath = hexPathFromVerticesAbs(INFLUENCE_MARKER_CENTERS_ABS);
  const [cx, cy] = CENTER_ABS;
  const svgClassName = [className, svgProps?.className].filter(Boolean).join(" ") || undefined;
  const svgStyle = { ...(svgProps?.style ?? {}), overflow: "visible" as const };
  const { className: _ignoredClassName, style: _ignoredStyle, ...restSvgProps } = svgProps ?? {};

  return (
    <svg
      {...restSvgProps}
      className={svgClassName}
      viewBox={viewBoxToString(VIEWBOX)}
      xmlns="http://www.w3.org/2000/svg"
      style={svgStyle}
    >
      <path
        d={hexPath}
        fill={baseFill}
        stroke={BASE_OUTLINE_COLOR}
        strokeWidth={BASE_OUTLINE_WIDTH}
        strokeLinejoin="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={INNER_DISC_RADIUS}
        fill={INNER_DISC_FILL}
        stroke={INNER_DISC_OUTLINE_COLOR}
        strokeWidth={INNER_DISC_OUTLINE_WIDTH}
        strokeLinejoin="round"
      />
      {content ? <g>{content}</g> : null}
      <GlassOverlay />
      {children ? <g>{children}</g> : null}
    </svg>
  );
}
