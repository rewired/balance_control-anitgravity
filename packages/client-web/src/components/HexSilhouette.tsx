import React from 'react';
import { HEX_NORMALIZED_PATH_POINTS } from '../ui/tiles/tileGeometry';

const CLIP_PATH_D = `M ${HEX_NORMALIZED_PATH_POINTS.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
const OUTLINE_PATH_D = `M ${HEX_NORMALIZED_PATH_POINTS.map(([x, y]) => `${x * 100} ${y * 100}`).join(" L ")} Z`;

/**
 * HexSilhouette provides a canonical SVG clipPath and visual outline for hex-shaped cells,
 * derived from the geometry of base_tile.svg.
 * 
 * @remarks
 * This centralizes the hex geometry to avoid "polygon drift" in CSS.
 * It uses objectBoundingBox so the clipPath scales with the element it's applied to.
 */
export const HexSilhouette: React.FC = () => {
    return (
        <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
            <defs>
                <clipPath id="hex-outline-clip" clipPathUnits="objectBoundingBox">
                    <path d={CLIP_PATH_D} />
                </clipPath>
            </defs>
        </svg>
    );
};

interface HexOutlineProps {
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Renders an SVG outline matching the canonical hex shape.
 * Useful for ghost tiles or selection highlights where a specific stroke/glow is needed.
 */
export const HexOutline: React.FC<HexOutlineProps> = ({ className, style }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={className}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                ...style
            }}
        >
            <path
                d={OUTLINE_PATH_D}
                fill="none"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};
