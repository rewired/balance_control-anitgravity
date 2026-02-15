export interface Coordinate {
    q: number;
    r: number;
}

export function coordToString(c: Coordinate): string {
    return `${c.q},${c.r}`;
}

export function stringToCoord(s: string): Coordinate {
    const [q, r] = s.split(',').map(Number);
    return { q, r };
}

/**
 * CORE-01-00-T08: Deterministic total-order key for canonical ordering.
 * Primary sort: r (row), secondary: q (column).
 */
export function positionKey(c: Coordinate): string {
    const R = c.r + 10000;
    const Q = c.q + 10000;
    return `${R.toString().padStart(6, '0')}_${Q.toString().padStart(6, '0')}`;
}

/** Derive positionKey from grid coord string "q,r". */
export function positionKeyFromCoordString(coordStr: string): string {
    return positionKey(stringToCoord(coordStr));
}

export function getNeighbors(c: Coordinate): Coordinate[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: c.q + d.q, r: c.r + d.r }));
}

export function isSurrounded(c: Coordinate, grid: Record<string, string>): boolean {
    const neighbors = getNeighbors(c);
    return neighbors.every(n => grid[coordToString(n)] !== undefined);
}
