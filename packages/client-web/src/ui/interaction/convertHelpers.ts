import { canonicalJsonStringify } from './utils';
import type { LegalIntent } from '@balance-control/game';

export interface ConvertComboGroup {
    inputKey: string;
    inputResourceIds: string[];
    variants: LegalIntent[];
}

export interface ConvertOutputGroup {
    outputResort: string;
    combos: ConvertComboGroup[];
}

export interface ConvertTileGroup {
    grassrootsTileId: string;
    outputs: ConvertOutputGroup[];
}

/**
 * Groups convertResources intents by grassroots tile, then output resort, then input combo.
 * @remarks Presentation-only.
 */
export function groupConvertIntents(intents: LegalIntent[]): Map<string, ConvertTileGroup> {
    const convertIntents = intents.filter((i) => i.moveType === 'convertResources');
    const result = new Map<string, ConvertTileGroup>();

    for (const intent of convertIntents) {
        const tileId = intent.payload?.grassrootsTileId;
        const outputResort = intent.payload?.outputResort;
        if (typeof tileId !== 'string' || typeof outputResort !== 'string') continue;

        const inputResourceIds: string[] = intent.payload?.inputResourceIds ?? [];
        const inputKey = [...inputResourceIds].sort().join('|');

        if (!result.has(tileId)) {
            result.set(tileId, { grassrootsTileId: tileId, outputs: [] });
        }

        const tileGroup = result.get(tileId)!;
        let outputGroup = tileGroup.outputs.find(o => o.outputResort === outputResort);
        if (!outputGroup) {
            outputGroup = { outputResort, combos: [] };
            tileGroup.outputs.push(outputGroup);
        }

        let comboGroup = outputGroup.combos.find(c => c.inputKey === inputKey);
        if (!comboGroup) {
            comboGroup = { inputKey, inputResourceIds, variants: [] };
            outputGroup.combos.push(comboGroup);
        }

        comboGroup.variants.push(intent);
    }

    // Sorting
    for (const tileGroup of result.values()) {
        // Sort outputs by resort name
        tileGroup.outputs.sort((a, b) => a.outputResort.localeCompare(b.outputResort));
        for (const outputGroup of tileGroup.outputs) {
            // Sort combos by inputKey
            outputGroup.combos.sort((a, b) => a.inputKey.localeCompare(b.inputKey));
            for (const comboGroup of outputGroup.combos) {
                // Sort variants by full canonical payload
                comboGroup.variants.sort((a, b) => {
                    return canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {}));
                });
            }
        }
    }

    return result;
}
