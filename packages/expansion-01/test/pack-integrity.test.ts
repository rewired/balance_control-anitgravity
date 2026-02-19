import { describe, it, expect } from 'vitest';
import { Expansion01, MEASURE_IDS, MEASURE_ATOM_BUILDERS } from '../src/engine/index';
import { GameState } from '@balance-control/rules';

describe('EXP-01 Pack Integrity', () => {
    it('has correct id', () => {
        expect(Expansion01.id).toBe('exp01');
    });

    it('defines measure decks with correct prefix', () => {
        expect(Expansion01.measureDecks).toBeDefined();
        expect(Expansion01.measureDecks).toHaveLength(1);
        expect(Expansion01.measureDecks![0].id).toBe('measures');
        expect(Expansion01.measureDecks![0].objectIdPrefix).toBe('exp01_measure_');
    });

    it('defines zones', () => {
        expect(Expansion01.zones).toBeDefined();
        expect(Expansion01.zones.length).toBeGreaterThan(0);
        expect(Expansion01.zones).toContain('OpenMeasures');
    });

    describe('Measure Dispatch', () => {
        it('has a builder for every declared measure ID', () => {
            MEASURE_IDS.forEach(id => {
                expect(MEASURE_ATOM_BUILDERS[id], `Measure ${id} should have a builder`).toBeDefined();
                expect(typeof MEASURE_ATOM_BUILDERS[id]).toBe('function');
            });
        });

        it('returns null for unknown measure ID', () => {
            const G = {} as GameState;
            expect(Expansion01.getMeasureAtoms!(G, 'UNKNOWN', {})).toBeNull();
        });

        it('dispatches known measure IDs correctly', () => {
             const G = { engine: { idSeq: 0 } } as GameState;
             const payload = { playerId: 'p1', targetTileId: 't1' };
             // Just verify it doesn't throw and returns something (atoms array)
             const atoms = Expansion01.getMeasureAtoms!(G, 'M01', payload);
             expect(atoms).toBeDefined();
             expect(Array.isArray(atoms)).toBe(true);
        });
    });
});
