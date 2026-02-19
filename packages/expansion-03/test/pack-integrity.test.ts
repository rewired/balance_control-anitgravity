import { describe, it, expect } from 'vitest';
import { Expansion03, MEASURE_IDS, MEASURE_ATOM_BUILDERS } from '../src/engine/index';
import { GameState } from '@balance-control/rules';

describe('EXP-03 Pack Integrity', () => {
    it('has correct id', () => {
        expect(Expansion03.id).toBe('exp03');
    });

    it('defines measure decks with correct prefix', () => {
        expect(Expansion03.measureDecks).toBeDefined();
        expect(Expansion03.measureDecks).toHaveLength(1);
        expect(Expansion03.measureDecks![0].id).toBe('measures');
        expect(Expansion03.measureDecks![0].objectIdPrefix).toBe('exp03_measure_');
    });

    it('defines zones', () => {
        expect(Expansion03.zones).toBeDefined();
        expect(Expansion03.zones.length).toBeGreaterThan(0);
        expect(Expansion03.zones).toContain('CountdownSupply');
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
            expect(Expansion03.getMeasureAtoms!(G, 'UNKNOWN', {})).toBeNull();
        });

        it('dispatches known measure IDs correctly', () => {
             const G = { engine: { idSeq: 0 } } as GameState;
             const payload = { playerId: 'p1', targetTileId: 't1' };
             const atoms = Expansion03.getMeasureAtoms!(G, 'M01', payload);
             expect(atoms).toBeDefined();
             expect(Array.isArray(atoms)).toBe(true);
        });
    });
});
