import { beforeEach, describe, expect, it } from 'vitest';
import type { Ctx } from 'boardgame.io';
import { getPublicSurface, getPublicSurfaceHash, validateSurfaceHash } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeDummyExpansionPack } from './_helpers/dummyPacks';

describe('Public surface hashing', () => {
    const Exp01Pack = makeDummyExpansionPack({ id: 'exp01' });
    const Exp02Pack = makeDummyExpansionPack({ id: 'exp02' });
    const Exp03Pack = makeDummyExpansionPack({ id: 'exp03' });

    beforeEach(() => {
        registerTestPacks([Exp01Pack, Exp02Pack, Exp03Pack]);
    });

    it('produces stable hashes for identical pack selections', () => {
        const config = { expansions: { ex01: true, ex02: false, ex03: true } };
        const hashA = getPublicSurfaceHash(config);
        const hashB = getPublicSurfaceHash(config);
        expect(hashA).toBe(hashB);
        expect(hashA.length).toBe(64);
    });

    it('produces different hashes for different pack selections', () => {
        const coreOnly = getPublicSurfaceHash({ expansions: { ex01: false, ex02: false, ex03: false } });
        const ex01 = getPublicSurfaceHash({ expansions: { ex01: true, ex02: false, ex03: false } });
        expect(coreOnly).not.toBe(ex01);
    });

    it('stores locked packs and hash in meta during setup', () => {
        const ctx = { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as Ctx;
        const G = SetupGame({ ctx, setupData: { packs: { enabledPacks: ['exp01'] } } });
        const surface = getPublicSurface(G.meta?.cfg as any);
        expect(G.meta?.publicSurfaceHash).toBe(getPublicSurfaceHash(G.meta?.cfg as any));
        expect(G.meta?.enabledPacks).toEqual(surface.packs);
        expect(G.meta?.enabledPacks?.map((pack) => pack.id)).toEqual(['core', 'exp01']);
    });

    it('throws when validating a mismatched surface hash', () => {
        const ctx = { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as Ctx;
        const G = SetupGame({ ctx, setupData: { packs: { enabledPacks: [] } } });
        const originalHash = G.meta?.publicSurfaceHash;
        G.meta = { ...(G.meta ?? {}), publicSurfaceHash: 'invalid-hash' } as any;
        expect(() => validateSurfaceHash(G)).toThrow(/Engine and game state mismatch/);
        expect(() => validateSurfaceHash(G)).toThrow(
            `'invalid-hash', but the current engine's hash is '${originalHash}'`
        );
    });
});
