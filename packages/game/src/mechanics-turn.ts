import { GameState, CoreZoneNames, TileType } from '@balance-control/rules';
import { positionKeyFromCoordString } from './topology';
import { EffectResolver } from './engine/resolver';

/** CORE-01-08-01: Max influence cap */
export function getInfluenceCap(ctx: any): number {
    return ctx.numPlayers >= 5 ? 8 : 7;
}

/** Count total Influence objects owned by a player */
export function countPlayerInfluence(G: any, pid: string): number {
    let count = 0;
    for (const obj of Object.values(G.objects) as any[]) {
        if (obj.type === 'Influence' && obj.owner === pid) count++;
    }
    return count;
}

/** CORE-01-08-02: Check if ALL starting influence has been placed on Board by ALL players */
export function allStartingInfluencePlaced(G: any, ctx: any): boolean {
    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        if (!supply) continue;
        for (const itemId of supply.items) {
            const obj = G.objects[itemId];
            if (obj && obj.type === 'Influence' && obj.isStarting) {
                return false;
            }
        }
    }
    return true;
}

export function returnMetaMarkersAtRoundStart(G: GameState) {
    const currentRound = G.roundNumber ?? 0;
    const attrs = G.engine.attributes || {};
    if (attrs.roundStartProcessed === currentRound) return;
    attrs.roundStartProcessed = currentRound;
    G.engine.attributes = attrs;

    for (const obj of Object.values(G.objects)) {
        if (!obj || obj.type !== 'MetaMarker') continue;
        if (!obj.owner) continue;
        if (typeof obj.expiresRound !== 'number') continue;
        if (obj.expiresRound > currentRound) continue;

        const supplyId = `${CoreZoneNames.PersonalSupply}:${obj.owner}`;
        const supply = G.zones[supplyId];
        if (!supply) continue;

        const currentZoneId = findObjectZoneId(G, obj.id);
        if (currentZoneId && currentZoneId !== supplyId) {
            const currentZone = G.zones[currentZoneId];
            currentZone.items = currentZone.items.filter(id => id !== obj.id);
        }

        if (!supply.items.includes(obj.id)) {
            supply.items.push(obj.id);
        }

        obj.expiresRound = undefined;
        obj.mode = undefined;
    }
}

function findObjectZoneId(G: GameState, objectId: string): string | null {
    for (const zone of Object.values(G.zones)) {
        if (zone.items.includes(objectId)) return zone.id;
    }
    return null;
}

/** CORE-01-04-09A: Return Meta-Marker to PersonalSupply and set mode = None when Political Action did not place/update it. */
export function returnMetaMarkerToSupply(G: GameState, playerId: string): void {
    const supplyId = `${CoreZoneNames.PersonalSupply}:${playerId}`;
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
        obj.expiresRound = undefined;
    }
}

export function drawMeasure(G: GameState, ctx: any) {
    // Basic drawMeasure for EXP-01/02
    // ... logic would go here, or just stub for now if not used yet
}

/** CORE-01-09-01A: Run final Round Settlement (production sweep in PositionKey order). */
export function runFinalRoundSettlement(G: GameState & { engine: any; grid?: Record<string, string> }, ctx: any): void {
    const boardZone = G.zones[CoreZoneNames.Board];
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

