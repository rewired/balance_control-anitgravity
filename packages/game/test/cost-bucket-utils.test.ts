import { describe, expect, it } from 'vitest';
import { CoreZoneName, type GameState } from '@balance-control/rules';
import {
    resolveProvidedOrDeterministicResourceIds,
    splitCombinedResourceIds,
    validateDistinctCostBuckets,
} from '../src/engine/cost-bucket-utils';

describe('cost bucket utilities', () => {
    const createState = (): GameState => ({
        zones: {
            [CoreZoneName.PersonalSupply + ':p1']: {
                id: CoreZoneName.PersonalSupply + ':p1',
                name: 'Personal Supply',
                items: ['res_b', 'res_a', 'res_c']
            }
        },
        objects: {
            res_a: { id: 'res_a', type: 'Resource', owner: 'p1', resort: 'DOM' } as any,
            res_b: { id: 'res_b', type: 'Resource', owner: 'p1', resort: 'FOR' } as any,
            res_c: { id: 'res_c', type: 'Resource', owner: 'p1', resort: 'INF' } as any,
        },
        tiles: {},
        adjacency: {},
        grid: {},
        engine: {
            idSeq: 0,
            effectQueue: [],
            activeModifiers: [],
            history: [],
            attributes: {
                limits: { startCommittee: 1 },
                usage: {},
                prohibitions: {},
                tileExtraCosts: {},
                playerExtraCosts: {},
                climateCostRules: [],
            }
        }
    } as any);

    it('detects duplicates in a single bucket', () => {
        expect(validateDistinctCostBuckets([['res_a', 'res_a']])).toBe(false);
    });

    it('rejects overlap across semantic buckets', () => {
        expect(validateDistinctCostBuckets([['res_a', 'res_b'], ['res_b']])).toBe(false);
    });

    it('keeps deterministic fallback selection stable when IDs are omitted', () => {
        const G = createState();
        const selected = resolveProvidedOrDeterministicResourceIds(G, 'p1', ['ANY', 'ANY'], undefined);
        expect(selected).toEqual(['res_a', 'res_b']);
    });

    it('splits combined-cost IDs into expected partition lengths', () => {
        const buckets = splitCombinedResourceIds(['r1', 'r2', 'r3', 'r4'], [1, 3]);
        expect(buckets).toEqual([['r1'], ['r2', 'r3', 'r4']]);
    });
});
