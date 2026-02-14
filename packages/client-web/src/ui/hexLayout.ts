export type AxialCoord = { q: number; r: number };
export type RectBounds = { minX: number; minY: number; maxX: number; maxY: number };
export type BoardLayout = {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    cellWidth: number;
    cellHeight: number;
    contentBounds: RectBounds;
};

export function parseCoordString(coord: string): AxialCoord {
    const [qRaw, rRaw] = coord.split(',');
    return { q: Number(qRaw), r: Number(rRaw) };
}

// Pointy-top axial to pixel:
// x = size * (sqrt(3) * q + sqrt(3)/2 * r)
// y = size * (3/2 * r)
export function axialToPixel(coord: AxialCoord, hexSize: number): { x: number; y: number } {
    const root3 = Math.sqrt(3);
    return {
        x: hexSize * (root3 * coord.q + (root3 / 2) * coord.r),
        y: hexSize * (1.5 * coord.r)
    };
}

export function computeBounds(coords: AxialCoord[], hexSize: number): RectBounds {
    if (coords.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    const pixels = coords.map((coord) => axialToPixel(coord, hexSize));
    const xs = pixels.map((p) => p.x);
    const ys = pixels.map((p) => p.y);
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys)
    };
}

export function computeBoardLayout(coordStrings: string[], hexSize: number): BoardLayout {
    const coords = coordStrings.map(parseCoordString);
    const bounds = computeBounds(coords, hexSize);
    const padding = hexSize * 1.5;
    const minWidth = hexSize * 4;
    const minHeight = hexSize * 4;
    const width = Math.max(bounds.maxX - bounds.minX + padding * 2, minWidth);
    const height = Math.max(bounds.maxY - bounds.minY + padding * 2, minHeight);
    const offsetX = -bounds.minX + padding;
    const offsetY = -bounds.minY + padding;
    const cellWidth = Math.sqrt(3) * hexSize;
    const cellHeight = 2 * hexSize;
    const contentBounds = {
        minX: bounds.minX + offsetX - cellWidth / 2,
        minY: bounds.minY + offsetY - cellHeight / 2,
        maxX: bounds.maxX + offsetX + cellWidth / 2,
        maxY: bounds.maxY + offsetY + cellHeight / 2
    };
    return {
        width,
        height,
        offsetX,
        offsetY,
        cellWidth,
        cellHeight,
        contentBounds
    };
}

export function stableSortCoords(coordStrings: string[]): string[] {
    return [...coordStrings].sort((a, b) => a.localeCompare(b));
}
