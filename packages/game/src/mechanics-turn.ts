import { GameState, CoreZoneName, TileType } from '@balance-control/rules';
import { positionKeyFromCoordString } from './topology';
import { EffectResolver } from './engine/resolver';
import { findObjectZoneId, getPlayerMetaMarker } from './state-lookup';

/**
 * Returns the maximum influence cap based on player count.
 * @rule CORE-01-08-01
 * @rule ADD56-01-03-00-01
 * @deterministic
 * @pure
 */
export function getInfluenceCap(ctx: any): number {
    return ctx.numPlayers >= 5 ? 8 : 7;
}

export function countPlayerInfluence(G: any, pid: string): number {
    let count = 0;
    for (const obj of Object.values(G.objects) as any[]) {
        if (obj.type === 'Influence' && obj.owner === pid) count++;
    }
    return count;
}


/**
 * Checks if the player has at least one Influence in their PersonalSupply.
 * @rule CORE-01-04-11A
 * @deterministic
 * @pure
 */
export function hasInfluenceInSupply(G: any, pid: string): boolean {
    const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
    const supply = G.zones[supplyId];
    if (!supply) return false;
    return supply.items.some((itemId: string) => {
        const obj = G.objects[itemId];
        return obj && obj.type === 'Influence';
    });
}

/**
 * Checks if all starting influence has been placed by all players.
 * @rule CORE-01-08-02
 * @deterministic
 * @pure
 */
export function allStartingInfluencePlaced(G: any, ctx: any): boolean {
    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        if (!supply) continue;
        for (const itemId of supply.items) {
            const obj = G.objects[itemId];
            if (
                obj
                && obj.type === 'Influence'
                && Object.prototype.hasOwnProperty.call(obj, 'isStarting')
                && obj.isStarting === true
            ) {
                return false;
            }
        }
    }
    return true;
}

/**
 * CORE-01-04-09A: Return Meta-Marker to PersonalSupply and set mode = None when Political Action did not place/update it.
 * @rule CORE-01-04-09A
 * @rule CORE-01-07-03A
 * @rule CORE-01-07-03B
 * @rule CORE-01-07-03C
 * @deterministic
 * @sideEffects
 */
export function returnMetaMarkerToSupply(G: GameState, playerId: string): void {
    const supplyId = `${CoreZoneName.PersonalSupply}:${playerId}`;
    const supply = G.zones[supplyId];
    if (!supply) return;

    for (const obj of Object.values(G.objects)) {
        if (!obj || obj.type !== 'MetaMarker' || obj.owner !== playerId) continue;

        const currentZoneId = findObjectZoneId(G, obj.id);
        if (currentZoneId && currentZoneId !== supplyId) {
            const currentZone = G.zones[currentZoneId];
            if (currentZone) {
                currentZone.items = currentZone.items.filter((id: string) => id !== obj.id);
            }
        }

        if (!supply.items.includes(obj.id)) {
            supply.items.push(obj.id);
        }
        obj.mode = undefined;
    }
}

/**
 * Draws a measure (EXP-01-00/02 stub).
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function drawMeasure(G: GameState, ctx: any) {
    // Basic drawMeasure for EXP-01-00/02
    // ... logic would go here, or just stub for now if not used yet
}

/**
 * Runs the final round settlement.
 * @rule CORE-01-09-01A
 * @deterministic
 * @sideEffects
 */
export function runFinalRoundSettlement(G: GameState & { engine: any; grid?: Record<string, string> }, ctx: any): void {
    const boardZone = G.zones[CoreZoneName.Board];
    const grid = G.grid ?? {};
    if (!boardZone) return;

    const resortTilesWithCoord: { tileId: string; posKey: string }[] = [];
    for (const tileId of boardZone.items) {
        const tile = G.tiles[tileId];
        if (tile?.type !== TileType.Resort) continue;
        const coordStr = Object.entries(grid).find(([, id]) => id === tileId)?.[0];
        resortTilesWithCoord.push({
            tileId,
            posKey: coordStr ? positionKeyFromCoordString(coordStr) : tileId
        });
    }
    resortTilesWithCoord.sort((a, b) => a.posKey.localeCompare(b.posKey));
    for (const { tileId } of resortTilesWithCoord) {
        G.engine.effectQueue.push({ kind: 'production.resolve', tileId });
    }
    EffectResolver.resolve(G, ctx);
}
