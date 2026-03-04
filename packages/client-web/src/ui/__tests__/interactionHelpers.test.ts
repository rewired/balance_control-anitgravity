import { describe, expect, it } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { groupFormalizeIntents } from '../interaction/formalizeHelpers';
import { groupConvertIntents } from '../interaction/convertHelpers';
import { groupMeasureIntents } from '../interaction/measureHelpers';

function intent(moveType: string, payload: any = {}): LegalIntent {
    return { moveType, payload };
}

describe('interaction helpers', () => {
    describe('groupFormalizeIntents', () => {
        it('groups and sorts formalize intents deterministically', () => {
            const intents: LegalIntent[] = [
                // Committee C1
                // Payment P1 (DOM, FOR)
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['FOR', 'DOM'], extraResourceIds: ['X'] }), // Variant 1
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['DOM', 'FOR'], extraResourceIds: ['Y'] }), // Variant 2
                // Payment P2 (ECO)
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['ECO'] }),

                // Committee C2
                intent('formalizeInfluence', { committeeTileId: 'C2', paymentResorts: [] }),
            ];

            const groupsMap = groupFormalizeIntents(intents);

            expect(groupsMap.size).toBe(2);
            expect(Array.from(groupsMap.keys())).toEqual(['C1', 'C2']);

            const c1Groups = groupsMap.get('C1')!;
            expect(c1Groups).toHaveLength(2);

            // Expected order:
            // 1. Payment "DOM|FOR" (sorted paymentResorts)
            // 2. Payment "ECO"
            expect(c1Groups[0].paymentKey).toBe('DOM|FOR');
            expect(c1Groups[1].paymentKey).toBe('ECO');

            // Check variants sorting in first group
            // Expected order: extraResourceIds "X" then "Y"
            const variants = c1Groups[0].variants;
            expect(variants).toHaveLength(2);
            expect(variants[0].payload.extraResourceIds).toEqual(['X']);
            expect(variants[1].payload.extraResourceIds).toEqual(['Y']);
        });
    });

    describe('groupConvertIntents', () => {
        it('groups and sorts convert intents deterministically', () => {
            const intents: LegalIntent[] = [
                // Tile T1
                // Output O1
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 2, extraResourceIds: ['Z'] }),
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 2, extraResourceIds: ['X'] }),
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 3 }),

                // Output O2
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O2', inputCount: 2 }),
            ];

            const groupsMap = groupConvertIntents(intents);
            const t1Group = groupsMap.get('T1')!;

            expect(t1Group.outputs).toHaveLength(2);
            expect(t1Group.outputs[0].outputResort).toBe('O1');
            expect(t1Group.outputs[1].outputResort).toBe('O2');

            const o1Variants = t1Group.outputs[0].variants;
            expect(o1Variants).toHaveLength(3);

            // Sorting: inputCount ASC, then canonical payload (so extraResourceIds "X" then "Z")
            expect(o1Variants[0].payload.inputCount).toBe(2);
            expect(o1Variants[0].payload.extraResourceIds).toEqual(['X']);
            expect(o1Variants[1].payload.inputCount).toBe(2);
            expect(o1Variants[1].payload.extraResourceIds).toEqual(['Z']);
            expect(o1Variants[2].payload.inputCount).toBe(3);
        });

        it('ignores invalid and unrelated intents while preserving fallback sorting', () => {
            const intents: LegalIntent[] = [
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputResourceIds: ['R1', 'R2'] }),
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: '3', inputResourceIds: ['R1'] }),
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 4 }),
                intent('convertResources', { grassrootsTileId: 'T1', inputCount: 2 }), // missing outputResort
                intent('convertResources', { outputResort: 'O2', inputCount: 1 }), // missing grassrootsTileId
                intent('convertResources', { grassrootsTileId: 'T2', outputResort: 'O2', inputCount: 1 }),
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['A'] }),
            ];

            const groupsMap = groupConvertIntents(intents);

            expect(Array.from(groupsMap.keys())).toEqual(['T1', 'T2']);
            const t1Outputs = groupsMap.get('T1')?.outputs ?? [];
            expect(t1Outputs.map((output) => output.outputResort)).toEqual(['O1']);

            const o1Variants = t1Outputs[0]?.variants ?? [];
            expect(o1Variants.map((variant) => variant.payload)).toEqual([
                { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: '3', inputResourceIds: ['R1'] },
                { grassrootsTileId: 'T1', outputResort: 'O1', inputResourceIds: ['R1', 'R2'] },
                { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 4 },
            ]);
        });
    });

    describe('groupMeasureIntents', () => {
        it('groups and sorts measure intents deterministically', () => {
            const intents: LegalIntent[] = [
                intent('exp01.takeMeasure', 'm2'),
                intent('exp01.takeMeasure', 'm1'),
                intent('exp02.takeMeasure', 'm3'),
            ];

            const groups = groupMeasureIntents(intents);

            expect(groups).toHaveLength(2);
            expect(groups[0].expansionId).toBe('exp01');
            expect(groups[1].expansionId).toBe('exp02');

            // exp01 group sorted by payload (measure ID)
            // "m1" < "m2"
            // Wait, payload is "m2" and "m1" strings.
            // canonicalJsonStringify("m1") -> "\"m1\""
            // canonicalJsonStringify("m2") -> "\"m2\""
            expect(groups[0].intents[0].payload).toBe('m1');
            expect(groups[0].intents[1].payload).toBe('m2');
        });

        it('ignores non-measure and malformed moveType formats', () => {
            const intents: LegalIntent[] = [
                intent('takeMeasure', 'core-like-no-prefix'),
                intent('exp01.takeMeasure', ''),
                intent('exp01.takeMeasure', 'm2'),
                intent('exp01.takeMeasure', 'm1'),
                intent('exp02.takeMeasure', {}),
                intent('exp02.takeMeasure', null),
                intent('exp03.takeMeasure.extra', 'not-a-match'),
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['A'] }),
            ];

            const groups = groupMeasureIntents(intents);

            expect(groups.map((group) => group.expansionId)).toEqual(['exp01', 'exp02']);
            expect(groups[0]?.intents.map((entry) => entry.payload)).toEqual(['', 'm1', 'm2']);
            expect(groups[1]?.intents.map((entry) => entry.payload)).toEqual([{}, null]);
        });
    });

    describe('groupFormalizeIntents', () => {
        it('ignores invalid formalize intents and keeps deterministic payment grouping', () => {
            const intents: LegalIntent[] = [
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['B', 'A'], extraResourceIds: ['Z'] }),
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['A', 'B'], extraResourceIds: ['Y'] }),
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResorts: ['C'] }),
                intent('formalizeInfluence', { committeeTileId: 'C1' }), // missing paymentResorts
                intent('formalizeInfluence', { paymentResorts: ['D'] }), // missing committeeTileId
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputCount: 1 }),
            ];

            const groupsMap = groupFormalizeIntents(intents);

            expect(Array.from(groupsMap.keys())).toEqual(['C1']);
            const c1Groups = groupsMap.get('C1') ?? [];
            expect(c1Groups.map((group) => group.paymentKey)).toEqual(['', 'A|B', 'C']);
            expect(c1Groups[0]?.variants.map((variant) => variant.payload)).toEqual([{ committeeTileId: 'C1' }]);
            expect(c1Groups[1]?.variants.map((variant) => variant.payload)).toEqual([
                { committeeTileId: 'C1', paymentResorts: ['A', 'B'], extraResourceIds: ['Y'] },
                { committeeTileId: 'C1', paymentResorts: ['B', 'A'], extraResourceIds: ['Z'] },
            ]);
        });
    });
});
