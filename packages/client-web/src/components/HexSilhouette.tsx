import React from 'react';

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
                {/* 
                  Geometry derived from base_tile.svg (747x864 viewbox):
                  (373.5, 0)   -> (0.5, 0)
                  (747, 216)   -> (1.0, 0.25)
                  (747, 648)   -> (1.0, 0.75)
                  (373.5, 864) -> (0.5, 1.0)
                  (0, 648)     -> (0, 0.75)
                  (0, 216)     -> (0, 0.25)
                */}
                <clipPath id="hex-outline-clip" clipPathUnits="objectBoundingBox">
                    <path d="M 0.5 0 L 1 0.25 L 1 0.75 L 0.5 1 L 0 0.75 L 0 0.25 Z" />
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
                d="M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z"
                fill="none"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};
