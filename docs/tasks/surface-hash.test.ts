import { describe, it, expect, beforeEach } from 'vitest';
import { Ctx } from 'boardgame.io';
import { EnginePackRegistry } from '../src/expansion-registry';
import { getPublicSurface, validateSurfaceHash } from '../src/surface';
import { SetupGame } from '../src/setup';
import { registerPacks } from './_helpers/registerPacks';
import { hashState } from '../src/hash-state';

describe('Public Surface Hashing and Validation', () => {
  beforeEach(() => {
    EnginePackRegistry.clear();
    registerPacks(); // Registers core + all expansions
  });

  it('should produce a stable hash for the same configuration', () => {
    const config = { expansions: { ex01: true, ex03: true } };
    const surface1 = getPublicSurface(config);
    const hash1 = hashState(surface1);

    const surface2 = getPublicSurface(config);
    const hash2 = hashState(surface2);

    expect(hash1).toBe(hash2);
    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // sha256 hex
  });

  it('should produce a different hash for different configurations', () => {
    const coreOnlyHash = hashState(getPublicSurface({ expansions: {} }));
    const ex01Hash = hashState(getPublicSurface({ expansions: { ex01: true } }));
    expect(coreOnlyHash).not.toBe(ex01Hash);
  });

  it('should be stored in G.meta during setup', () => {
    const ctx = { numPlayers: 2 } as Ctx;
    const config = { expansions: { ex01: true } };
    const G = SetupGame(ctx, { gameConfig: config });

    const expectedSurface = getPublicSurface(config);
    const expectedHash = hashState(expectedSurface);

    expect(G.meta.publicSurfaceHash).toBe(expectedHash);
    expect(G.meta.enabledPacks).toEqual(expectedSurface.packs);
    expect(G.meta.enabledPacks.map((p) => p.id)).toEqual(['core', 'exp01']);
  });

  it('validateSurfaceHash should throw an error on mismatch', () => {
    const ctx = { numPlayers: 2 } as Ctx;
    const G = SetupGame(ctx, { gameConfig: { expansions: {} } });
    const originalHash = G.meta.publicSurfaceHash;

    G.meta.publicSurfaceHash = 'invalid-hash-for-testing';

    expect(() => validateSurfaceHash(G)).toThrow(/Engine and game state mismatch/);
    expect(() => validateSurfaceHash(G)).toThrow(`'invalid-hash-for-testing', but the current engine's hash is '${originalHash}'`);
  });
});
