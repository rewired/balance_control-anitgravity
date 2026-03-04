import { CoreZoneName } from '@balance-control/rules';

/**
 * Returns the player's meta marker object.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function getPlayerMetaMarker(G: any, playerId: string): any | null {
    const directId = `meta_${playerId}`;
    const objects = (G?.objects ?? {}) as Record<string, any>;

    const direct = objects[directId];
    if (direct && direct.type === 'MetaMarker') return direct;

    for (const obj of Object.values(objects)) {
        if (obj && obj.type === 'MetaMarker' && obj.owner === playerId) return obj;
    }

    return null;
}

/**
 * Finds the zone ID containing the specified object.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function findObjectZoneId(G: any, objectId: string): string | null {
    const zones = (G?.zones ?? {}) as Record<string, any>;
    for (const zone of Object.values(zones)) {
        if (zone?.items?.includes(objectId)) return zone.id;
    }
    return null;
}

/**
 * Counts the Influence objects owned by a player that are on the Board.
 * @rule CORE-01-09-03
 * @deterministic
 * @pure
 */
export function countBoardInfluence(G: any, pid: string): number {
    const boardZone = G.zones[CoreZoneName.Board];
    if (!boardZone) return 0;

    let count = 0;
    for (const tileId of boardZone.items) {
        const tileZone = G.zones[tileId];
        if (!tileZone) continue;
        for (const itemId of tileZone.items) {
            const obj = G.objects[itemId];
            if (obj && obj.type === 'Influence' && obj.owner === pid) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Updates global statistics in G.meta.stats for all players.
 * @remarks server-authoritative stats for UI presentation.
 * @deterministic
 * @sideEffects
 */
export function updateGlobalStats(G: any, ctx: any): void {
    if (!G.meta) G.meta = {};
    if (!G.meta.stats) G.meta.stats = {};

    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const boardInf = countBoardInfluence(G, pid);
        const metaMarker = getPlayerMetaMarker(G, pid);
        let metaLocation: 'Supply' | 'Board' | 'Unknown' = 'Unknown';
        let metaMode = undefined;

        if (metaMarker) {
            const zoneId = findObjectZoneId(G, metaMarker.id);
            if (zoneId) {
                if (zoneId.startsWith(CoreZoneName.PersonalSupply)) {
                    metaLocation = 'Supply';
                } else {
                    // Check if it's on a board tile
                    const boardZone = G.zones[CoreZoneName.Board];
                    if (boardZone?.items.includes(zoneId)) {
                        metaLocation = 'Board';
                    }
                }
            }
            metaMode = metaMarker.mode;
        }

        G.meta.stats[pid] = {
            boardInfluence: boardInf,
            metaMarker: {
                location: metaLocation,
                mode: metaMode
            }
        };
    }
}
