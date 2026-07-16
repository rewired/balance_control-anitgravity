import { CoreZoneName } from '@balance-control/rules';
import { getPlayerMetaMarker, findObjectZoneId } from '@balance-control/game';

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
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function coreUpdateStats(G: any, ctx: any): void {
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
