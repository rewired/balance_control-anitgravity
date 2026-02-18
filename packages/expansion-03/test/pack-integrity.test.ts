import { describe, it, expect } from 'vitest';
import { Expansion03 } from '../src/engine/index';

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
});
