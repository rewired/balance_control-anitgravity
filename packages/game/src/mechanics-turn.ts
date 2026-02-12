import { GameState, CoreZoneNames, TileType } from '@balance-control/rules';
import { coordToString, getNeighbors, stringToCoord } from './topology';

/**
 * CORE-01-04-04: Draw one tile from DrawPile to staging.
 * CORE-01-04-06/07: If tile can't be legally placed → DiscardFaceUp + redraw.
 */
export function drawTileToStaging(G: GameState, ctx: any) {
    const drawPile = G.zones[CoreZoneNames.DrawPile];
    const stagingId = `staging_${ctx.currentPlayer}`;

    // Ensure staging zone exists
    if (!G.zones[stagingId]) {
        G.zones[stagingId] = { id: stagingId, name: 'Staging', items: [] };
    }
    const staging = G.zones[stagingId];

    // If already has a tile, don't draw (idempotency)
    if (staging.items.length > 0) return;

    // Redraw loop (CORE-01-04-06/07)
    let attempts = 0;
    const maxAttempts = drawPile.items.length; // Safety: can't loop more than pile size

    while (attempts < maxAttempts) {
        if (drawPile.items.length === 0) {
            return; // No more tiles to draw
        }

        const tileId = drawPile.items.pop();
        if (!tileId) return;

        // Check if this tile can be legally placed anywhere
        if (canBeLegallyPlaced(G)) {
            staging.items.push(tileId);
            return; // Success
        }

        // CORE-01-04-06: Cannot be placed → move to DiscardFaceUp
        const discardZone = G.zones[CoreZoneNames.DiscardFaceUp];
        if (discardZone) {
            discardZone.items.push(tileId);
        }

        // CORE-01-04-07: Draw again
        attempts++;
    }
}

/**
 * Check if there exists at least one empty hex adjacent to any Board tile.
 * If so, the drawn tile CAN be legally placed.
 * (Any tile type can be placed on any empty adjacent hex.)
 */
function canBeLegallyPlaced(G: GameState): boolean {
    // Find all occupied coordinates
    const occupied = new Set(Object.keys(G.grid));

    // If board is empty, any placement is legal
    if (occupied.size === 0) return true;

    // Check if ANY occupied tile has at least one empty neighbor
    for (const coordStr of occupied) {
        const coord = stringToCoord(coordStr);
        const neighbors = getNeighbors(coord);
        for (const n of neighbors) {
            const nStr = coordToString(n);
            if (!occupied.has(nStr)) {
                return true; // Found an empty adjacent spot
            }
        }
    }

    return false; // All adjacent positions occupied (extremely unlikely)
}
