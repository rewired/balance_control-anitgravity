import { describe, expect, it } from 'vitest';
import { CoreZoneNames, TileType, type GameConfig, type GameState } from '@balance-control/rules';
import { CorePack } from '../src/packs/core';

function makeBaseState(cfg: GameConfig): GameState {
    return {
        zones: {},
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
        meta: {
            ruleset: {
                coreVersion: 'v1.1.0',
                expansions: {},
                specAnchorHash: '5F563AFF09ADCAF45B62E5CBBB97C5DC5D722EE2B56E3AB67B7B71BEA2F9FEF3',
            },
            cfg,
        },
        engine: {
            idSeq: 0,
            effectQueue: [],
            activeModifiers: [],
            history: [],
            attributes: {
                limits: {
                    politicalAction: 1,
                    'measure.hold': 2,
                    'measure.play': 1,
                    startCommittee: 1,
                },
                prohibitions: {},
                usage: {},
                tileExtraCosts: {},
                playerExtraCosts: {},
                climateCostRules: [],
                enabledExpansions: { ...cfg.expansions },
            },
        },
    } as any;
}

describe('CorePack.setup.preShuffle', () => {
    it('initializes base zones + Start Committee deterministically', () => {
        const cfg: GameConfig = { expansions: { ex01: false, ex02: false, ex03: false } };
        const ctx: any = { numPlayers: 3 };

        const G1 = makeBaseState(cfg);
        CorePack.setup?.preShuffle?.(G1, ctx, cfg);

        const G2 = makeBaseState(cfg);
        CorePack.setup?.preShuffle?.(G2, ctx, cfg);

        expect(G1.zones[CoreZoneNames.DrawPile]).toBeTruthy();
        expect(G1.zones[CoreZoneNames.DiscardFaceUp]).toBeTruthy();
        expect(G1.zones[CoreZoneNames.Board]).toBeTruthy();
        expect(G1.zones[CoreZoneNames.Bank]).toBeTruthy();
        expect(G1.zones[CoreZoneNames.Noise]).toBeTruthy();

        const startId = 'tile_start_committee';
        expect(G1.tiles[startId]?.type).toBe(TileType.StartCommittee);
        expect(G1.zones[CoreZoneNames.Board].items).toContain(startId);
        expect(G1.zones[startId]).toBeTruthy();
        expect(G1.grid['0,0']).toBe(startId);

        for (let i = 0; i < ctx.numPlayers; i++) {
            const pid = i.toString();
            const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
            const markerId = `meta_${pid}`;
            expect(G1.objects[markerId]).toBeTruthy();
            expect(G1.zones[zoneId]?.items).toContain(markerId);
        }

        expect(G1.zones[CoreZoneNames.DrawPile].items.length).toBe(71);
        expect(G1.zones[CoreZoneNames.DrawPile].items).toEqual(G2.zones[CoreZoneNames.DrawPile].items);

        for (const tileId of G1.zones[CoreZoneNames.DrawPile].items) {
            expect(G1.zones[tileId]).toBeTruthy();
        }
    });
});

