import { describe, it, expect } from 'vitest';
import { Expansion02 } from '../src/engine/index';

describe('EXP-02 Pack Integrity', () => {
    it('has correct id', () => {
        expect(Expansion02.id).toBe('exp02');
    });

    it('defines measure decks with correct prefix', () => {
        expect(Expansion02.measureDecks).toBeDefined();
        expect(Expansion02.measureDecks).toHaveLength(1);
        expect(Expansion02.measureDecks![0].id).toBe('measures');
        expect(Expansion02.measureDecks![0].objectIdPrefix).toBe('exp02_measure_');
    });

    it('defines zones', () => {
        expect(Expansion02.zones).toBeDefined();
        expect(Expansion02.zones.length).toBeGreaterThan(0);
        expect(Expansion02.zones).toContain('RegulationSupply');
    });
});
