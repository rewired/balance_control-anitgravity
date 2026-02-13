import { describe, expect, it } from 'vitest';
import { TileType } from '@balance-control/rules';
import { ExpansionRegistry } from '../src/expansion-registry';
import { EffectResolver } from '../src/engine/resolver';

describe('EffectResolver cost and production behavior', () => {
    it('should not mutate state when resource.pay cannot be fully paid', () => {
        const G: any = {
            zones: {
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['res_dom_1'] },
                Bank: { id: 'Bank', name: 'Bank', items: [] }
            },
            tiles: {},
            objects: {
                res_dom_1: { id: 'res_dom_1', type: 'Resource', owner: 'p1', resort: 'DOM' }
            },
            adjacency: {},
            grid: {},
            engine: {
                idSeq: 0,
                effectQueue: [
                    { kind: 'resource.pay', playerId: 'p1', amount: 2, resorts: ['DOM'] },
                    { kind: 'influence.formalize', playerId: 'p1', resourceIds: [] }
                ],
                activeModifiers: [],
                history: [],
                attributes: {}
            }
        };

        const ok = EffectResolver.resolve(G, {});

        expect(ok).toBe(false);
        expect(G.zones['PersonalSupply:p1'].items).toEqual(['res_dom_1']);
        expect(G.zones.Bank.items).toEqual([]);
        expect(G.engine.effectQueue).toEqual([]);
        expect(G.engine.history).toEqual([]);
        expect(G.engine.idSeq).toBe(0);
    });

    it('should split tied production evenly and send remainder to Noise', () => {
        const bankIds = ['res_dom_1', 'res_dom_2', 'res_dom_3', 'res_dom_4', 'res_dom_5', 'res_dom_6'];
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                'PersonalSupply:p2': { id: 'PersonalSupply:p2', name: 'PS2', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: ['inf_p1', 'inf_p2'] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 5, resort: 'DOM' }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                inf_p2: { id: 'inf_p2', type: 'Influence', owner: 'p2' },
                res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' },
                res_dom_3: { id: 'res_dom_3', type: 'Resource', resort: 'DOM' },
                res_dom_4: { id: 'res_dom_4', type: 'Resource', resort: 'DOM' },
                res_dom_5: { id: 'res_dom_5', type: 'Resource', resort: 'DOM' },
                res_dom_6: { id: 'res_dom_6', type: 'Resource', resort: 'DOM' }
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
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(2);
        expect(G.zones['PersonalSupply:p2'].items).toHaveLength(2);
        expect(G.zones.Noise.items).toHaveLength(1);
        expect(G.zones.Bank.items).toHaveLength(1);
    });

    it('should reduce production by PingPong and cap at 10', () => {
        const bankIds = Array.from({ length: 20 }, (_, i) => `res_dom_${i}`);
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: ['inf_p1', 'meta_p1'] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 25, resort: 'DOM' }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                meta_p1: { id: 'meta_p1', type: 'MetaMarker', owner: 'p1', mode: 'PingPong' },
                ...bankIds.reduce((acc: any, id) => {
                    acc[id] = { id, type: 'Resource', resort: 'DOM' };
                    return acc;
                }, {})
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
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(10);
        expect(G.zones.Bank.items).toHaveLength(10);
    });

    it('should not reduce production when controller is missing', () => {
        const bankIds = ['res_dom_1', 'res_dom_2', 'res_dom_3', 'res_dom_4', 'res_dom_5'];
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                'PersonalSupply:p2': { id: 'PersonalSupply:p2', name: 'PS2', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: ['inf_p1', 'inf_p2', 'meta_p1'] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 5, resort: 'DOM' }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                inf_p2: { id: 'inf_p2', type: 'Influence', owner: 'p2' },
                meta_p1: { id: 'meta_p1', type: 'MetaMarker', owner: 'p1', mode: 'PingPong' },
                res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' },
                res_dom_3: { id: 'res_dom_3', type: 'Resource', resort: 'DOM' },
                res_dom_4: { id: 'res_dom_4', type: 'Resource', resort: 'DOM' },
                res_dom_5: { id: 'res_dom_5', type: 'Resource', resort: 'DOM' }
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
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(2);
        expect(G.zones['PersonalSupply:p2'].items).toHaveLength(2);
        expect(G.zones.Noise.items).toHaveLength(1);
        expect(G.zones.Bank.items).toHaveLength(0);
    });

    it('should apply PingPong reduction after production modifiers and round down', () => {
        ExpansionRegistry.clear();
        ExpansionRegistry.register({
            name: 'PingPongModExp',
            modifiers: {
                production: (_tileId, _G, base) => base + 2
            }
        });

        const bankIds = ['res_dom_1', 'res_dom_2', 'res_dom_3', 'res_dom_4', 'res_dom_5', 'res_dom_6', 'res_dom_7'];
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: ['inf_p1', 'meta_p1'] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 5, resort: 'DOM' }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                meta_p1: { id: 'meta_p1', type: 'MetaMarker', owner: 'p1', mode: 'PingPong' },
                res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' },
                res_dom_3: { id: 'res_dom_3', type: 'Resource', resort: 'DOM' },
                res_dom_4: { id: 'res_dom_4', type: 'Resource', resort: 'DOM' },
                res_dom_5: { id: 'res_dom_5', type: 'Resource', resort: 'DOM' },
                res_dom_6: { id: 'res_dom_6', type: 'Resource', resort: 'DOM' },
                res_dom_7: { id: 'res_dom_7', type: 'Resource', resort: 'DOM' }
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
        ExpansionRegistry.clear();

        expect(ok).toBe(true);
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(3);
        expect(G.zones.Bank.items).toHaveLength(4);
    });

    it('should produce 0 when production is prohibited', () => {
        const bankIds = ['res_dom_1', 'res_dom_2'];
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: [...bankIds] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                tile_resort: { id: 'tile_resort', name: 'Tile', items: ['inf_p1'] }
            },
            tiles: {
                tile_resort: { id: 'tile_resort', type: TileType.Resort, weight: 2, resort: 'DOM' }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' }
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
                attributes: {
                    prohibitions: {
                        'production.resolve': true
                    }
                }
            }
        };

        const ok = EffectResolver.resolve(G, {});

        expect(ok).toBe(true);
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(0);
        expect(G.zones.Bank.items).toHaveLength(2);
        expect(G.zones.Noise.items).toHaveLength(0);
    });
});
