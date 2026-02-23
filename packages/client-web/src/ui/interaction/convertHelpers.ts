import { canonicalJsonStringify } from './utils';
import type { LegalIntent } from '@balance-control/game';

export interface ConvertOutputGroup {
    outputResort: string;
    variants: LegalIntent[];
}

export interface ConvertTileGroup {
    grassrootsTileId: string;
    outputs: ConvertOutputGroup[];
}

/**
 * Groups convertResources intents by grassroots tile, then output resort.
 * @remarks Presentation-only. Must never render token IDs (e.g. `RES_*`) to users.
 */
export function groupConvertIntents(intents: LegalIntent[]): Map<string, ConvertTileGroup> {
    const convertIntents = intents.filter((i) => i.moveType === 'convertResources');
    const result = new Map<string, ConvertTileGroup>();

    for (const intent of convertIntents) {
        const tileId = intent.payload?.grassrootsTileId;
        const outputResort = intent.payload?.outputResort;
        if (typeof tileId !== 'string' || typeof outputResort !== 'string') continue;

        if (!result.has(tileId)) {
            result.set(tileId, { grassrootsTileId: tileId, outputs: [] });
        }

        const tileGroup = result.get(tileId)!;
        let outputGroup = tileGroup.outputs.find(o => o.outputResort === outputResort);
        if (!outputGroup) {
            outputGroup = { outputResort, variants: [] };
            tileGroup.outputs.push(outputGroup);
        }
        outputGroup.variants.push(intent);
    }

    // Sorting
    for (const tileGroup of result.values()) {
        // Sort outputs by resort name
        tileGroup.outputs.sort((a, b) => a.outputResort.localeCompare(b.outputResort));
        for (const outputGroup of tileGroup.outputs) {
            // Sort variants by stable key. Prefer lower inputCount, then payload canonical.
            outputGroup.variants.sort((a, b) => {
                const aCount = inferInputCount(a.payload);
                const bCount = inferInputCount(b.payload);
                if (aCount !== bCount) return aCount - bCount;
                return canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {}));
            });
        }
    }

    return result;
}

function inferInputCount(payload: any): number {
    const declared = payload?.inputCount;
    if (typeof declared === 'number' && Number.isFinite(declared)) return declared;
    const ids = payload?.inputResourceIds;
    if (Array.isArray(ids)) return ids.length;
    return Number.POSITIVE_INFINITY;
}
