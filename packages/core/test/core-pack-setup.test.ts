import { describe, expect, it } from 'vitest';
import { CoreZoneName, RULESET_MANIFEST, TileType, type GameConfig, type GameState } from '@balance-control/rules';
import { CorePack } from '../src/engine';

function makeBaseState(cfg: GameConfig): GameState {
    return {
        zones: {},
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
        meta: {
            ruleset: {
                coreVersion: RULESET_MANIFEST.coreVersion,
                expansions: {},
                specAnchorHash: RULESET_MANIFEST.specAnchorHash,
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

        expect(G1.zones[CoreZoneName.DrawPile]).toBeTruthy();
        expect(G1.zones[CoreZoneName.DiscardFaceUp]).toBeTruthy();
        expect(G1.zones[CoreZoneName.Board]).toBeTruthy();
        expect(G1.zones[CoreZoneName.Bank]).toBeTruthy();
        expect(G1.zones[CoreZoneName.Noise]).toBeTruthy();

        const startId = 'tile_start_committee';
        expect(G1.tiles[startId]?.type).toBe(TileType.StartCommittee);
        expect(G1.zones[CoreZoneName.Board].items).toContain(startId);
        expect(G1.zones[startId]).toBeTruthy();
        expect(G1.grid['0,0']).toBe(startId);

        for (let i = 0; i < ctx.numPlayers; i++) {
            const pid = i.toString();
            const zoneId = `${CoreZoneName.PersonalSupply}:${pid}`;
            const markerId = `meta_${pid}`;
            expect(G1.objects[markerId]).toBeTruthy();
            expect(G1.zones[zoneId]?.items).toContain(markerId);
        }

        expect(G1.zones[CoreZoneName.DrawPile].items.length).toBe(71);
        expect(G1.zones[CoreZoneName.DrawPile].items).toEqual(G2.zones[CoreZoneName.DrawPile].items);

        for (const tileId of G1.zones[CoreZoneName.DrawPile].items) {
            expect(G1.zones[tileId]).toBeTruthy();
        }
    });
});

