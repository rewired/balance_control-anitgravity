import { GameState, TileType } from '@balance-control/rules';

/**
 * Determines if a Move influence action is legal based on adjacency and the Start-Bridge rule.
 *
 * CORE-01-04-12D Move Adjacency Requirement:
 * A Move is legal only if MoveAdjacent(sourceTile, destinationTile) = true, where:
 * MoveAdjacent(A,B) is true if
 * (a) Adjacent(A,B) = true, or
 * (b) Adjacent(A, StartCommittee) = true and Adjacent(StartCommittee, B) = true, with A ≠ StartCommittee, B ≠ StartCommittee, A ≠ B.
 *
 * CORE-01-08-06E Targeting Restriction:
 * Start Committee may not be destination of PlaceOrMoveInfluence (Place) and may not be source/destination of PlaceOrMoveInfluence (Move).
 *
 * @rule CORE-01-04-12D
 * @rule CORE-01-08-06D
 * @rule CORE-01-08-06E
 * @rule CORE-01-00-T01
 * @rule CORE-01-00-T02
 * @rule CORE-01-00-T03
 * @rule CORE-01-00-T07A
 * @deterministic
 * @pure
 */
export function isMoveAdjacent(G: GameState, sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return false;

    const sourceTile = G.tiles[sourceId];
    const targetTile = G.tiles[targetId];

    // CORE-01-08-06E: Start Committee may not be source or destination of Move
    if (sourceTile?.type === TileType.StartCommittee || targetTile?.type === TileType.StartCommittee) {
        return false;
    }

    const neighborsA = G.adjacency[sourceId] || [];

    // (a) Adjacent(A,B) = true
    if (neighborsA.includes(targetId)) {
        return true;
    }

    // (b) Adjacent(A, StartCommittee) = true and Adjacent(StartCommittee, B) = true
    // Find the Start Committee ID
    const startCommitteeId = Object.keys(G.tiles).find(id => G.tiles[id]?.type === TileType.StartCommittee);
    if (startCommitteeId && neighborsA.includes(startCommitteeId)) {
        const neighborsStart = G.adjacency[startCommitteeId] || [];
        if (neighborsStart.includes(targetId)) {
            return true;
        }
    }

    return false;
}
