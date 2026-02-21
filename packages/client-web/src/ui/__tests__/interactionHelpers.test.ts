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
                // Payment P1 (A, B)
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResourceIds: ['B', 'A'], extraResourceIds: ['X'] }), // Variant 1
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResourceIds: ['A', 'B'], extraResourceIds: ['Y'] }), // Variant 2
                // Payment P2 (C)
                intent('formalizeInfluence', { committeeTileId: 'C1', paymentResourceIds: ['C'] }),

                // Committee C2
                intent('formalizeInfluence', { committeeTileId: 'C2', paymentResourceIds: [] }),
            ];

            const groupsMap = groupFormalizeIntents(intents);

            expect(groupsMap.size).toBe(2);
            expect(Array.from(groupsMap.keys())).toEqual(['C1', 'C2']); // Map iteration order is insertion order, but logic doesn't guarantee key sort.
            // However, the groups within each committee are sorted.

            const c1Groups = groupsMap.get('C1')!;
            expect(c1Groups).toHaveLength(2);

            // Expected order:
            // 1. Payment "A|B" (sorted paymentResourceIds)
            // 2. Payment "C"
            expect(c1Groups[0].paymentKey).toBe('A|B');
            expect(c1Groups[1].paymentKey).toBe('C');

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
                // Input I1 (A)
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputResourceIds: ['A'], extraResourceIds: ['Z'] }),
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputResourceIds: ['A'], extraResourceIds: ['X'] }),

                // Input I2 (B)
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O1', inputResourceIds: ['B'] }),

                // Output O2
                intent('convertResources', { grassrootsTileId: 'T1', outputResort: 'O2', inputResourceIds: ['A'] }),
            ];

            const groupsMap = groupConvertIntents(intents);
            const t1Group = groupsMap.get('T1')!;

            expect(t1Group.outputs).toHaveLength(2);
            expect(t1Group.outputs[0].outputResort).toBe('O1');
            expect(t1Group.outputs[1].outputResort).toBe('O2');

            const o1Combos = t1Group.outputs[0].combos;
            expect(o1Combos).toHaveLength(2);
            expect(o1Combos[0].inputKey).toBe('A');
            expect(o1Combos[1].inputKey).toBe('B');

            const aVariants = o1Combos[0].variants;
            expect(aVariants).toHaveLength(2);
            // Expected order: "X" then "Z"
            expect(aVariants[0].payload.extraResourceIds).toEqual(['X']);
            expect(aVariants[1].payload.extraResourceIds).toEqual(['Z']);
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
    });
});
