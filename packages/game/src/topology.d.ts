export interface Coordinate {
    q: number;
    r: number;
}
export declare function coordToString(c: Coordinate): string;
export declare function stringToCoord(s: string): Coordinate;
export declare function getNeighbors(c: Coordinate): Coordinate[];
export declare function isSurrounded(c: Coordinate, grid: Record<string, string>): boolean;
//# sourceMappingURL=topology.d.ts.map