import type { RectBounds } from './hexLayout';

export type ViewportSize = { width: number; height: number };
export type FitTransform = { scale: number; x: number; y: number };

export function computeFitTransform(bounds: RectBounds, viewportSize: ViewportSize, paddingPx: number): FitTransform {
    const boundsWidth = Math.max(0, bounds.maxX - bounds.minX);
    const boundsHeight = Math.max(0, bounds.maxY - bounds.minY);
    const availableWidth = Math.max(0, viewportSize.width - paddingPx * 2);
    const availableHeight = Math.max(0, viewportSize.height - paddingPx * 2);
    if (boundsWidth === 0 || boundsHeight === 0 || availableWidth === 0 || availableHeight === 0) {
        return { scale: 1, x: 0, y: 0 };
    }
    const scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
    const scaledWidth = boundsWidth * scale;
    const scaledHeight = boundsHeight * scale;
    const x = (viewportSize.width - scaledWidth) / 2 - bounds.minX * scale;
    const y = (viewportSize.height - scaledHeight) / 2 - bounds.minY * scale;
    return { scale, x, y };
}
