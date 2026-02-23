import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { stringToCoord, coordToString, getNeighbors, isSurrounded, positionKeyFromCoordString } from '../../topology';
import { EffectResolver } from '../../engine/resolver';
import { placeTilePayloadSchema, validateMovePayload } from '../../move-contracts';
import { DRAW_AND_PLACE_STAGE, requireStage } from '../shared';

/**
 * Checks if there is any open placement on the board.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function hasAnyOpenPlacement(G: any): boolean {
    const grid = G.grid ?? {};
    const coords = Object.keys(grid);
    if (coords.length === 0) return false;
    for (const coordStr of coords) {
        const coord = stringToCoord(coordStr);
        const neighbors = getNeighbors(coord);
        for (const n of neighbors) {
            if (!grid[coordToString(n)]) return true;
        }
    }
    return false;
}

export const DrawAndPlaceMoves = {
    /**
     * Places the drawn tile at the target coordinate.
     * @rule CORE-01-04-02
     * @rule CORE-01-04-05
     * @deterministic
     * @sideEffects
     */
    placeTile: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('placeTile', placeTilePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { targetCoord, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, DRAW_AND_PLACE_STAGE, 'placeTile')) return INVALID_MOVE;
        const stagingId = `staging_${pid}`;
        const staging = G.zones[stagingId];

        if (!staging || staging.items.length === 0) return INVALID_MOVE;

        const tileId = staging.items[0];
        const tile = G.tiles[tileId];

        // Structural validations
        if (G.grid[targetCoord]) return INVALID_MOVE; // Occupied

        const coord = stringToCoord(targetCoord);
        const neighbors = getNeighbors(coord);

        // CORE-01-04-05: Must be adjacent to at least one Board tile
        const hasNeighbor = neighbors.some((n) => G.grid[coordToString(n)] !== undefined);
        if (!hasNeighbor) {
            if (Object.keys(G.grid).length > 0) return INVALID_MOVE;
        }

        // Generalized Action Type for cost check
        const actionType = tile && tile.type === TileType.Resort ? 'placeResort' : 'placeTile';

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, actionType, pid)) return INVALID_MOVE;

        // Decoupled Extra Costs (Side-effectful)
        if (!EffectResolver.checkAndPayCosts(G, pid, actionType, undefined, extraResourceIds)) return INVALID_MOVE;

        const boardZone = G.zones[CoreZoneName.Board];

        staging.items.shift();
        boardZone.items.push(tileId);

        G.grid[targetCoord] = tileId;

        if (!G.adjacency[tileId]) G.adjacency[tileId] = [];

        neighbors.forEach((n) => {
            const nStr = coordToString(n);
            const nId = G.grid[nStr];
            if (nId) {
                G.adjacency[tileId].push(nId);
                if (!G.adjacency[nId]) G.adjacency[nId] = [];
                G.adjacency[nId].push(tileId);
            }
        });

        // CORE-01-06-02/03/03A: Hotspot check — skip StartCommittee; resolve in ascending PositionKey order
        const resolved = G.engine.attributes.resolvedHotspots ?? [];
        const candidatePairs: { coordStr: string; tileId: string }[] = [];
        [coord, ...neighbors].forEach((c) => {
            const cStr = coordToString(c);
            const tId = G.grid[cStr];
            if (!tId || resolved.includes(tId)) return;
            const candidateTile = G.tiles[tId];
            if (candidateTile?.type === TileType.StartCommittee) return;
            if (isSurrounded(c, G.grid)) candidatePairs.push({ coordStr: cStr, tileId: tId });
        });
        candidatePairs
            .sort((a, b) => positionKeyFromCoordString(a.coordStr).localeCompare(positionKeyFromCoordString(b.coordStr)))
            .forEach(({ tileId }) => G.engine.effectQueue.push({ kind: 'hotspot.resolve', tileId }));
        EffectResolver.resolve(G, ctx);

        // End Stage → politicalAction
        if (events && events.endStage) {
            events.endStage();
        } else if (events && events.setStage) {
            events.setStage('politicalAction');
        }
    },
};

