import { describe, it, expect } from 'vitest';
import { CorePack } from '../src/engine/index';

describe('CORE Pack Integrity', () => {
    it('has correct id and required manifest', () => {
        expect(CorePack.id).toBe('core');
        expect(CorePack.manifest.id).toBe('core');
        expect(CorePack.manifest.required).toBe(true);
    });

    it('defines all CORE-01 moves', () => {
        expect(CorePack.moves).toBeDefined();
        const moveNames = Object.keys(CorePack.moves!).sort();
        expect(moveNames).toEqual([
            'convertResources',
            'formalizeInfluence',
            'moveInfluence',
            'placeInfluence',
            'placeTile',
            'resolveChoice',
        ]);
    });

    it('defines setup hooks', () => {
        expect(typeof CorePack.setup?.preShuffle).toBe('function');
        expect(typeof CorePack.setup?.postShuffle).toBe('function');
    });

    it('registers a non-empty set of engine atoms', () => {
        const atoms = CorePack.engine?.atoms?.({ triggerHook: () => undefined });
        expect(Array.isArray(atoms)).toBe(true);
        expect(atoms!.length).toBeGreaterThan(0);
    });

    it('supplies the full root-pack contract (only the required pack may populate these)', () => {
        expect(typeof CorePack.setupGame).toBe('function');
        expect(typeof CorePack.turn).toBe('object');
        expect(typeof CorePack.endIf).toBe('function');
        expect(typeof CorePack.playerView).toBe('function');
        expect(typeof CorePack.enumerateIntents).toBe('function');
        expect(typeof CorePack.updateStats).toBe('function');
        expect(typeof CorePack.wrapMovesForReplay).toBe('function');
    });

    it('root turn descriptor defines the CORE-01 stage structure', () => {
        const stageNames = Object.keys(CorePack.turn!.stages).sort();
        expect(stageNames).toEqual(['choice', 'drawAndPlace', 'politicalAction']);
        expect(CorePack.turn!.rootMoveIds).toEqual(['resolveChoice']);
    });
});
