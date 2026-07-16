import { beforeEach, describe, expect, it } from 'vitest';
import { TileType } from '@balance-control/rules';
import { EffectResolver } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Production resolve (uncontrolled resort)', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('should produce 0 when a resort tile has no controller and no tie winners', () => {
        const bankIds = ['res_dom_1', 'res_dom_2', 'res_dom_3', 'res_dom_4'];
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                'PersonalSupply:p2': { id: 'PersonalSupply:p2', name: 'PS2', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: [] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 4, resort: 'DOM' }
            },
            objects: {
                res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' },
                res_dom_3: { id: 'res_dom_3', type: 'Resource', resort: 'DOM' },
                res_dom_4: { id: 'res_dom_4', type: 'Resource', resort: 'DOM' }
            },
            adjacency: { tile_resort: [] },
            grid: {},
            engine: {
                idSeq: 0,
                effectQueue: [
                    { kind: 'production.resolve', tileId: 'tile_resort' }
                ],
                activeModifiers: [],
                history: [],
                attributes: {}
            }
        };

        const ok = EffectResolver.resolve(G, {});

        expect(ok).toBe(true);
        expect(G.zones['PersonalSupply:p1'].items).toEqual([]);
        expect(G.zones['PersonalSupply:p2'].items).toEqual([]);
        expect(G.zones.Noise.items).toEqual([]);
        expect(G.zones.Bank.items).toEqual(bankIds);
    });
});
