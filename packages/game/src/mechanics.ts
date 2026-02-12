import { GameState, TileType, GameObject, CoreZoneNames, ResourceType } from '@balance-control/rules';
import { ExpansionRegistry } from './expansion-registry';

export interface MajorityResult {
    controller: string | null;
    winners: string[];
}

export function computeMajority(tileId: string, G: GameState, visited: Set<string> = new Set()): MajorityResult {
    // CORE-01-08-05: Start Committee cannot be controlled
    const tile = G.tiles[tileId];
    if (tile && tile.type === TileType.StartCommittee) {
        return { controller: null, winners: [] };
    }

    if (visited.has(tileId)) {
        return { controller: null, winners: [] };
    }
    visited.add(tileId);

    const tileZone = G.zones[tileId];
    if (!tileZone) return { controller: null, winners: [] };

    const influenceCounts: Record<string, number> = {};

    for (const itemId of tileZone.items) {
        const obj = G.objects[itemId];
        if (obj && obj.type === 'Influence' && obj.owner) {
            influenceCounts[obj.owner] = (influenceCounts[obj.owner] || 0) + 1;
        }
    }

    // CORE-01-05-04: Lobbyist adjacency bonus
    const neighbors = G.adjacency[tileId] || [];
    for (const nId of neighbors) {
        const neighborTile = G.tiles[nId];
        if (neighborTile && neighborTile.type === TileType.Lobbyist) {
            const { controller } = computeMajority(nId, G, new Set(visited));
            if (controller) {
                influenceCounts[controller] = (influenceCounts[controller] || 0) + 1;
            }
        }
    }

    let max = 0;
    let winners: string[] = [];

    for (const [player, count] of Object.entries(influenceCounts)) {
        if (count > max) {
            max = count;
            winners = [player];
        } else if (count === max) {
            winners.push(player);
        }
    }

    if (winners.length === 1) {
        return { controller: winners[0], winners };
    }

    return { controller: null, winners: winners };
}
