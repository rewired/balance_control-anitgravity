export type AxialCoord = { q: number; r: number };

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

export function computeBounds(coords: AxialCoord[], hexSize: number): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
} {
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

export function stableSortCoords(coordStrings: string[]): string[] {
    return [...coordStrings].sort((a, b) => a.localeCompare(b));
}
