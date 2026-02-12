import { describe, expect, it } from 'vitest';
import { TileType } from '@balance-control/rules';
import { EffectResolver } from '../src/engine/resolver';

function createGrantState(atomOverrides?: Record<string, unknown>) {
    const bankIds = ['res_dom_1'];
    const grantAtom = {
        kind: 'resource.grant',
        playerId: 'CONTROLLER',
        amount: 1,
        resort: 'DOM',
        context: {
            tileId: 'tile_resort',
            source: 'tripwire-default'
        },
        ...(atomOverrides || {})
    };

    return {
        zones: {
            Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PS0', items: [] },
            tile_resort: { id: 'tile_resort', name: 'Tile', items: [] }
        },
        tiles: {
            tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 1, resort: 'DOM' }
        },
        objects: {
            res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' }
        },
        adjacency: { tile_resort: [] },
        grid: {},
        engine: {
            idSeq: 0,
            effectQueue: [grantAtom],
            activeModifiers: [],
            history: [],
            attributes: {}
        }
    } as any;
}

describe('Controller fallback hardening', () => {
    it('should throw when CONTROLLER grant has no controller and no explicit missingController policy', () => {
        const G = createGrantState({
            context: {
                tileId: 'tile_resort',
                source: 'tripwire-missing-policy'
            }
        });

        expect(() => EffectResolver.resolve(G, {})).toThrow('[resolver:resource.grant] missing controller for "tripwire-missing-policy"');
    });

    it('should skip grant when missingController is SKIP', () => {
        const G = createGrantState({
            missingController: 'SKIP',
            context: {
                tileId: 'tile_resort',
                source: 'tripwire-skip'
            }
        });

        const ok = EffectResolver.resolve(G, {});

        expect(ok).toBe(true);
        expect(G.zones.Noise.items).toEqual([]);
        expect(G.zones['PersonalSupply:0'].items).toEqual([]);
        expect(G.zones.Bank.items).toEqual(['res_dom_1']);
    });

    it('should grant to Noise only when missingController is explicitly NOISE', () => {
        const G = createGrantState({
            missingController: 'NOISE',
            context: {
                tileId: 'tile_resort',
                source: 'tripwire-noise'
            }
        });

        const ok = EffectResolver.resolve(G, {});

        expect(ok).toBe(true);
        expect(G.zones.Noise.items).toEqual(['res_dom_1']);
        expect(G.zones['PersonalSupply:0'].items).toEqual([]);
        expect(G.zones.Bank.items).toEqual([]);
        expect(G.objects.res_dom_1.owner).toBeUndefined();
    });
});
