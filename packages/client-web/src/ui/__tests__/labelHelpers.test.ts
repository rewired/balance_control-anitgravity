import { describe, expect, it } from 'vitest';
import { getObjectLabel } from '../interaction/labelHelpers';

describe('getObjectLabel', () => {
    it('returns objectId for unknown object id', () => {
        const G = { objects: {} } as any;

        expect(getObjectLabel(G, 'missing_object')).toBe('missing_object');
    });

    it('returns objectId for Resource without resort', () => {
        const G = {
            objects: {
                res_1: { id: 'res_1', type: 'Resource' },
            },
        } as any;

        expect(getObjectLabel(G, 'res_1')).toBe('res_1');
    });

    it('returns objectId for Measure without measureId', () => {
        const G = {
            objects: {
                measure_1: { id: 'measure_1', type: 'Measure' },
            },
        } as any;

        expect(getObjectLabel(G, 'measure_1')).toBe('measure_1');
    });
});
