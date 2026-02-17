import { CoreZoneNames, CoreResources } from '@balance-control/rules';
import { findObjectZoneId } from '../state-lookup';

export const DRAW_AND_PLACE_STAGE = 'drawAndPlace';
export const POLITICAL_ACTION_STAGE = 'politicalAction';

function getCurrentStage(ctx: any): string | undefined {
    return ctx?.activePlayers?.[ctx?.currentPlayer];
}

export function requireStage(ctx: any, expectedStage: string, moveName: string): boolean {
    const stage = getCurrentStage(ctx);
    if (stage === expectedStage) return true;

    console.error(`[move:${moveName}] illegal in stage "${stage ?? 'none'}"; expected "${expectedStage}".`);
    return false;
}

export function hasDuplicateIds(ids: string[]): boolean {
    return new Set(ids).size !== ids.length;
}

export function hasOverlap(a: string[], b?: string[]): boolean {
    if (!b || b.length === 0) return false;
    const set = new Set(a);
    return b.some(id => set.has(id));
}

export type CostSlot = string[] | 'ANY';

interface GrassrootsConversionSpec {
    inputSlots: number;
    outputSlots: number;
}

export function isBoardTile(G: any, tileId: string): boolean {
    const boardZone = G.zones[CoreZoneNames.Board];
    return Boolean(boardZone?.items?.includes(tileId));
}

/**
 * CORE-01-04-22K/22L: Validates declared variant and returns spec.
 * Untyped: 3 inputs only. Typed: 2 inputs (Variant A) or 3 inputs (Variant B, output â‰  T).
 * Legacy: tile with inputSlots:2 but no resort = Typed 2:1 only (Variant A).
 */
export function getGrassrootsConversionSpec(tile: any, inputCount: number, outputResort?: string): GrassrootsConversionSpec | null {
    const spec = tile?.conversion;
    if (!spec || typeof spec.inputSlots !== 'number') return null;

    const typedResort = spec.typedResort ?? tile?.resort;
    const isTyped = Boolean(typedResort) || spec.inputSlots === 2;

    if (isTyped) {
        if (inputCount === 2) {
            return { inputSlots: 2, outputSlots: 1 };
        }
        if (inputCount === 3 && typedResort) {
            // CORE-01-04-22L Variant B: output must be â‰  T (only when tile has resort)
            if (outputResort && outputResort === typedResort) return null;
            return { inputSlots: 3, outputSlots: 1 };
        }
        return null;
    }
    // Untyped CORE-01-04-22K: 3 inputs only
    if (inputCount === 3) {
        return { inputSlots: 3, outputSlots: 1 };
    }
    return null;
}

export function isCoreResort(resort: string): boolean {
    return resort === CoreResources.DOM || resort === CoreResources.FOR || resort === CoreResources.INF;
}

export function placeMetaMarkerOnTile(G: any, marker: any, tileId: string, mode: 'PingPong' | 'Convert', expiresRound: number) {
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
    marker.expiresRound = expiresRound;
}

