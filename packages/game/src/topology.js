"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordToString = coordToString;
exports.stringToCoord = stringToCoord;
exports.getNeighbors = getNeighbors;
exports.isSurrounded = isSurrounded;
function coordToString(c) {
    return `${c.q},${c.r}`;
}
function stringToCoord(s) {
    const [q, r] = s.split(',').map(Number);
    return { q, r };
}
function getNeighbors(c) {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: c.q + d.q, r: c.r + d.r }));
}
function isSurrounded(c, grid) {
    const neighbors = getNeighbors(c);
    return neighbors.every(n => grid[coordToString(n)] !== undefined);
}
//# sourceMappingURL=topology.js.map