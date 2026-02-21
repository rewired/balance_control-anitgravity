import { CoreZoneName } from '@balance-control/rules';
import { findObjectZoneId } from '../state-lookup';

export const DRAW_AND_PLACE_STAGE = 'drawAndPlace';
export const POLITICAL_ACTION_STAGE = 'politicalAction';

function getCurrentStage(ctx: any): string | undefined {
    return ctx?.activePlayers?.[ctx?.currentPlayer];
}

/**
 * Requires that the current stage matches the expected stage.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function requireStage(ctx: any, expectedStage: string, moveName: string): boolean {
    const stage = getCurrentStage(ctx);
    if (stage === expectedStage) return true;

    console.error(`[move:${moveName}] illegal in stage "${stage ?? 'none'}"; expected "${expectedStage}".`);
    return false;
}

/**
 * Checks if a list of IDs contains duplicates.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function hasDuplicateIds(ids: string[]): boolean {
    return new Set(ids).size !== ids.length;
}

/**
 * Checks if two lists of IDs have any overlap.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function hasOverlap(a: string[], b?: string[]): boolean {
    if (!b || b.length === 0) return false;
    const set = new Set(a);
    return b.some(id => set.has(id));
}

export type CostSlot = string[] | 'ANY';

/**
 * Checks if a tile is on the board.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function isBoardTile(G: any, tileId: string): boolean {
    const boardZone = G.zones[CoreZoneName.Board];
    return Boolean(boardZone?.items?.includes(tileId));
}

export * from '../mechanics/conversion';

/**
 * Places a meta-marker on a tile and sets its mode.
 * @rule CORE-01-02-17C
 * @deterministic
 * @sideEffects
 */
export function placeMetaMarkerOnTile(G: any, marker: any, tileId: string, mode: 'ReturnPenalty' | 'Convert') {
    const currentZoneId = findObjectZoneId(G, marker.id);
    if (currentZoneId && currentZoneId !== tileId) {
        const currentZone = G.zones[currentZoneId];
        if (currentZone) {
            currentZone.items = currentZone.items.filter((id: string) => id !== marker.id);
        }
    }

    const targetZone = G.zones[tileId];
    if (targetZone && !targetZone.items.includes(marker.id)) {
        targetZone.items.push(marker.id);
    }

    marker.mode = mode;
}
