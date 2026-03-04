import { markerIconUrls } from "./tileAssets";
import type { SeatId } from "./types";
import { CENTER_ABS } from "./tileGeometry";

/** Renders the owner's Meta-Marker as a small icon chip near the bottom-center of the tile. */

// Position: below tile center (between center and bottom vertex)
const CHIP_CY = CENTER_ABS[1] + 240;
const CHIP_CX = CENTER_ABS[0];
const CHIP_R = 68;
const CHIP_STROKE = 14;
// Icon is square, centered inside the chip
const ICON_SIZE = CHIP_R * 1.55;

function modeTitle(mode?: string): string {
    if (mode === "ReturnPenalty") return "Meta-Marker: Return Penalty";
    if (mode === "Convert") return "Meta-Marker: Convert";
    return "Meta-Marker";
}

function modeIconUrl(mode?: string): string | null {
    if (mode === "ReturnPenalty") return markerIconUrls.ReturnPenalty;
    if (mode === "Convert") return markerIconUrls.ConversionPenalty;
    return null;
}

export type MetaMarkerEntry = {
    seat: SeatId;
    color: string;
    mode?: string;
};

export type MetaMarkerOverlayProps = {
    markers: MetaMarkerEntry[];
};

/**
 * Renders Meta-Marker chips on tile using dedicated SVG icons.
 * Each chip: filled circle in owner color + mode icon.
 * Multiple markers stacked horizontally (rare — max 1 per tile under valid rules).
 *
 * @remarks Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 */
export function MetaMarkerOverlay({ markers }: MetaMarkerOverlayProps) {
    if (!markers || markers.length === 0) return null;

    const spacing = CHIP_R * 2 + 20;
    const totalWidth = markers.length * spacing;
    const startX = CHIP_CX - totalWidth / 2 + CHIP_R;

    return (
        <g pointerEvents="none">
            {markers.map((m, idx) => {
                const cx = startX + idx * spacing;
                const iconUrl = modeIconUrl(m.mode);
                const title = modeTitle(m.mode);
                const iconX = cx - ICON_SIZE / 2;
                const iconY = CHIP_CY - ICON_SIZE / 2;
                return (
                    <g key={`metamarker-${m.seat}`}>
                        <title>{title}</title>
                        {/* Drop shadow */}
                        <circle cx={cx} cy={CHIP_CY} r={CHIP_R + 6} fill="rgba(0,0,0,0.5)" />
                        {/* Colored chip */}
                        <circle
                            cx={cx}
                            cy={CHIP_CY}
                            r={CHIP_R}
                            fill={m.color}
                            stroke="#000"
                            strokeWidth={CHIP_STROKE}
                        />
                        {/* Mode icon — use dedicated SVG; fallback to nothing if mode=None */}
                        {iconUrl ? (
                            <image
                                href={iconUrl}
                                x={iconX}
                                y={iconY}
                                width={ICON_SIZE}
                                height={ICON_SIZE}
                            />
                        ) : (
                            /* No-mode marker: just show "M" so the chip isn't blank */
                            <text
                                x={cx}
                                y={CHIP_CY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#fff"
                                fontSize={64}
                                fontWeight={800}
                            >
                                M
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
}
