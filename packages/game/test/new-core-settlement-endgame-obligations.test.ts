import { describe, it, expect, beforeEach } from 'vitest';
import { CoreMoves } from '../src/moves';
import { GameState, TileType, CoreZoneName } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';
import { registerTestPacks } from './_helpers/registerPacks';
import { positionKeyFromCoordString } from '../src/topology';
import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from '../src/index';
import { SetupGame } from '../src/setup';

describe('CORE-01 Actions, Settlement and Endgame Obligations', () => {
    let G: GameState;
    let ctx: any;
    let events: any;

    beforeEach(() => {
        registerTestPacks();
        events = { endTurn: () => { }, endStage: () => { } };
        G = {
            zones: {
                [CoreZoneName.Board]: { id: CoreZoneName.Board, name: 'Board', items: ['board_t1', 'board_t2', 'board_gr', 'board_start'] },
                'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PS0', items: ['meta_0', 'inf_0_1', 'res_dom', 'res_for', 'res_inf', 'res_any'] },
                'PersonalSupply:1': { id: 'PersonalSupply:1', name: 'PS1', items: ['meta_1', 'inf_1_1'] },
                board_t1: { id: 'board_t1', name: 'T1', items: [] },
                board_t2: { id: 'board_t2', name: 'T2', items: [] },
                board_gr: { id: 'board_gr', name: 'GR', items: [] },
                board_start: { id: 'board_start', name: 'Start', items: [] },
                Bank: { id: 'Bank', name: 'Bank', items: ['res_bank_1', 'res_bank_2', 'res_bank_3', 'res_bank_4'] },
                Noise: { id: 'Noise', name: 'Noise', items: [] }
            },
            tiles: {
                board_t1: { id: 'board_t1', type: TileType.Resort, resort: 'DOM', weight: 1 },
                board_t2: { id: 'board_t2', type: TileType.Committee },
                board_gr: {
                    id: 'board_gr',
                    type: TileType.Grassroots,
                    conversion: {
                        inputSlots: 2,
                        outputSlots: 1
                    }
                } as any,
                board_start: { id: 'board_start', type: TileType.StartCommittee }
            },
            objects: {
                meta_0: { id: 'meta_0', type: 'MetaMarker', owner: '0' },
                meta_1: { id: 'meta_1', type: 'MetaMarker', owner: '1' },
                inf_0_1: { id: 'inf_0_1', type: 'Influence', owner: '0' },
                inf_1_1: { id: 'inf_1_1', type: 'Influence', owner: '1' },
                res_dom: { id: 'res_dom', type: 'Resource', owner: '0', resort: 'DOM' },
                res_for: { id: 'res_for', type: 'Resource', owner: '0', resort: 'FOR' },
                res_inf: { id: 'res_inf', type: 'Resource', owner: '0', resort: 'INF' },
                res_any: { id: 'res_any', type: 'Resource', owner: '0', resort: 'DOM' },
                res_bank_1: { id: 'res_bank_1', type: 'Resource', resort: 'DOM' },
                res_bank_2: { id: 'res_bank_2', type: 'Resource', resort: 'FOR' },
                res_bank_3: { id: 'res_bank_3', type: 'Resource', resort: 'INF' },
                res_bank_4: { id: 'res_bank_4', type: 'Resource', resort: 'DOM' }
            },
            adjacency: {
                board_t1: ['board_t2', 'board_gr', 'board_start'],
                board_t2: ['board_t1', 'board_gr', 'board_start'],
                board_gr: ['board_t1', 'board_t2', 'board_start'],
                board_start: ['board_t1', 'board_t2', 'board_gr']
            },
            grid: {
                '0,0': 'board_start',
                '1,0': 'board_t1',
                '0,1': 'board_t2',
                '1,1': 'board_gr'
            },
            engine: {
                idSeq: 0,
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {
                    limits: { 'politicalAction': 1, 'startCommittee': 1 },
                    usage: {},
                    prohibitions: {},
                }
            }
        } as any;

        ctx = {
            currentPlayer: '0',
            numPlayers: 2,
            activePlayers: { '0': 'politicalAction' }
        };
    });

    /** @rule CORE-01-04-11A */
    it('requires PersonalSupply > 0 for placeInfluence [CORE-01-04-11A]', () => {
        G.zones['PersonalSupply:0'].items = G.zones['PersonalSupply:0'].items.filter(id => G.objects[id].type !== 'Influence');
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t1' });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-04-14B */
    /** @rule CORE-01-08-10A */
    it('enforces Influence Cap on Start Committee formalization [CORE-01-04-14B, CORE-01-08-10A]', () => {
        for (let i = 2; i <= 7; i++) {
            const id = `inf_cap_${i}`;
            G.objects[id] = { id, type: 'Influence', owner: '0' } as any;
            G.zones.board_t1.items.push(id);
        }
        const result = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_start',
            paymentResourceIds: ['res_dom', 'res_for', 'res_inf', 'res_any']
        });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-04-14B */
    it('fails Start Committee formalization if payment cannot be made [CORE-01-04-14B]', () => {
        const result = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_start',
            paymentResourceIds: ['res_dom', 'res_for', 'res_any']
        });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-04-22B */
    it('requires control of at least one Grassroots tile for convertResources [CORE-01-04-22B]', () => {
        const result = CoreMoves.convertResources({ G, ctx, events }, {
            grassrootsTileId: 'board_gr',
            inputResourceIds: ['res_dom', 'res_for'],
            outputResort: 'INF'
        });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-04-22C */
    it('applies Repeat Penalty to convertResources [CORE-01-04-22C]', () => {
        G.zones.board_gr.items.push('inf_0_1');
        G.zones['PersonalSupply:0'].items = G.zones['PersonalSupply:0'].items.filter(id => id !== 'meta_0');
        G.zones.board_t1.items.push('meta_0');
        G.objects.meta_0.mode = 'Convert';
        G.zones['PersonalSupply:0'].items = G.zones['PersonalSupply:0'].items.filter(id => id !== 'res_any' && id !== 'res_inf');
        const fail = CoreMoves.convertResources({ G, ctx, events }, {
            grassrootsTileId: 'board_gr',
            inputResourceIds: ['res_dom', 'res_for'],
            outputResort: 'INF'
        });
        expect(fail).toBe(INVALID_MOVE);
        G.zones['PersonalSupply:0'].items.push('res_any');
        const success = CoreMoves.convertResources({ G, ctx, events }, {
            grassrootsTileId: 'board_gr',
            inputResourceIds: ['res_dom', 'res_for'],
            extraResourceIds: ['res_any'],
            outputResort: 'INF'
        });
        expect(success).not.toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-06-00-03 */
    it('ensures no partial state changes on failed formalizeInfluence [CORE-01-06-00-03]', () => {
        const before = JSON.stringify(G);
        CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_t2',
            paymentResourceIds: ['res_dom', 'res_any']
        });
        expect(JSON.stringify(G)).toBe(before);
    });

    /** @rule CORE-01-06-16 */
    /** @rule CORE-01-07-03D */
    it('resolves production in ascending PositionKey order [CORE-01-06-16, CORE-01-07-03D]', () => {
        registerTestPacks();
        const balanceControl = createBalanceControlGame();
        const client = Client({
            game: {
                ...balanceControl,
                setup: (ctx: any) => {
                    const G = SetupGame({ ctx });
                    G.grid = { '0,0': 'tile_start_committee' };
                    G.zones[CoreZoneName.Board].items = ['tile_start_committee'];
                    G.tiles.board_t1 = { id: 'board_t1', type: TileType.Resort, resort: 'DOM', weight: 1 };
                    G.tiles.board_t3 = { id: 'board_t3', type: TileType.Resort, resort: 'FOR', weight: 1 };
                    G.zones.board_t1 = { id: 'board_t1', name: 'T1', items: ['inf_0_1'] };
                    G.zones.board_t3 = { id: 'board_t3', name: 'T3', items: ['inf_1_1'] };
                    G.grid['1,0'] = 'board_t1';
                    G.grid['-1,0'] = 'board_t3';
                    G.zones[CoreZoneName.Board].items.push('board_t1', 'board_t3');
                    G.adjacency['tile_start_committee'] = ['board_t1', 'board_t3'];
                    G.adjacency['board_t1'] = ['tile_start_committee'];
                    G.adjacency['board_t3'] = ['tile_start_committee'];
                    G.objects.inf_0_1 = { id: 'inf_0_1', type: 'Influence', owner: '0' };
                    G.objects.inf_1_1 = { id: 'inf_1_1', type: 'Influence', owner: '1' };
                    G.engine.attributes.startingPlayerIndex = 0;
                    return G;
                }
            },
            numPlayers: 2
        });
        client.start();

        const cp0 = client.getState().ctx.currentPlayer;
        client.updatePlayerID(cp0);
        const staging0 = client.getState().G.zones[`staging_${cp0}`]?.items[0];
        client.moves.placeTile({ targetCoord: '0,1' });
        client.moves.placeInfluence({ targetTileId: staging0 });

        const cp1 = client.getState().ctx.currentPlayer;
        client.updatePlayerID(cp1);
        const staging1 = client.getState().G.zones[`staging_${cp1}`]?.items[0];
        client.moves.placeTile({ targetCoord: '0,-1' });
        client.moves.placeInfluence({ targetTileId: staging1 });

        const finalG = client.getState().G;
        const history = finalG.engine.history || [];
        const productionResolutions = history.filter((h: any) => h.atom === 'production.resolve');

        const t1Index = productionResolutions.findIndex((h: any) => h.tileId === 'board_t1');
        const t3Index = productionResolutions.findIndex((h: any) => h.tileId === 'board_t3');

        expect(t1Index).toBeGreaterThan(-1);
        expect(t3Index).toBeGreaterThan(-1);
        expect(t3Index).toBeLessThan(t1Index);
    });

    /** @rule CORE-01-08-01 */
    it('enforces Influence Cap of 7 total [CORE-01-08-01]', () => {
        for (let i = 2; i <= 7; i++) {
            const id = `inf_cap_${i}`;
            G.objects[id] = { id, type: 'Influence', owner: '0' } as any;
            G.zones.board_t1.items.push(id);
        }
        const result = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_t2',
            paymentResourceIds: ['res_dom', 'res_for']
        });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-08-02 */
    it('enforces formalize timing gate: all starting influence must be on Board [CORE-01-08-02]', () => {
        (G.objects.inf_0_1 as any).isStarting = true;
        const fail = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_t2',
            paymentResourceIds: ['res_dom', 'res_for']
        });
        expect(fail).toBe(INVALID_MOVE);
        G.zones['PersonalSupply:0'].items = G.zones['PersonalSupply:0'].items.filter(id => id !== 'inf_0_1');
        G.zones.board_t1.items.push('inf_0_1');
        (G.objects.inf_1_1 as any).isStarting = true;
        const fail2 = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_t2',
            paymentResourceIds: ['res_dom', 'res_for']
        });
        expect(fail2).toBe(INVALID_MOVE);
        G.zones['PersonalSupply:1'].items = G.zones['PersonalSupply:1'].items.filter(id => id !== 'inf_1_1');
        G.zones.board_t1.items.push('inf_1_1');
        const success = CoreMoves.formalizeInfluence({ G, ctx, events }, {
            committeeTileId: 'board_t2',
            paymentResourceIds: ['res_dom', 'res_for']
        });
        expect(success).not.toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-08-04 */
    it('prohibits placing influence on Start Committee [CORE-01-08-04]', () => {
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_start' });
        expect(result).toBe(INVALID_MOVE);
    });

    /** @rule CORE-01-09-01A */
    it('triggers final settlement and skips political action when DrawPile empty during draw [CORE-01-09-01A]', () => {
        registerTestPacks();
        const balanceControl = createBalanceControlGame();
        const client = Client({
            game: {
                ...balanceControl,
                setup: (ctx: any) => {
                    const G = SetupGame({ ctx });
                    G.zones[CoreZoneName.DrawPile].items = G.zones[CoreZoneName.DrawPile].items.slice(0, 1);
                    G.engine.attributes.startingPlayerIndex = 0;
                    return G;
                }
            },
            numPlayers: 2
        });
        client.start();

        const cp0 = client.getState().ctx.currentPlayer;
        client.updatePlayerID(cp0);
        const staging0 = client.getState().G.zones[`staging_${cp0}`]?.items[0];
        client.moves.placeTile({ targetCoord: '1,0' });

        const state2 = client.getState();
        expect(state2.ctx.gameover).toBeUndefined();
        client.moves.placeInfluence({ targetTileId: staging0 });
        const finalState = client.getState();
        expect(finalState.G.roundSettlementDone).toBe(true);
        expect(finalState.ctx.gameover).toBeDefined();
    });

    /** @rule CORE-01-09-01 */
    /** @rule CORE-01-09-03 */
    it('ends game when DrawPile is empty and awards winner by board Influence count [CORE-01-09-01, CORE-01-09-03]', () => {
        registerTestPacks();
        const balanceControl = createBalanceControlGame();
        const client = Client({
            game: {
                ...balanceControl,
                setup: (ctx: any) => {
                    const G = SetupGame({ ctx });
                    G.roundSettlementDone = true;
                    G.zones[CoreZoneName.DrawPile].items = [];
                    G.zones.board_t1 = { id: 'board_t1', name: 'T1', items: ['inf_0_a', 'inf_0_b'] };
                    G.zones.board_t2 = { id: 'board_t2', name: 'T2', items: ['inf_1_a'] };
                    G.zones[CoreZoneName.Board].items.push('board_t1', 'board_t2');
                    G.tiles.board_t1 = { id: 'board_t1', type: TileType.Committee };
                    G.tiles.board_t2 = { id: 'board_t2', type: TileType.Committee };
                    G.objects.inf_0_a = { id: 'inf_0_a', type: 'Influence', owner: '0' } as any;
                    G.objects.inf_0_b = { id: 'inf_0_b', type: 'Influence', owner: '0' } as any;
                    G.objects.inf_1_a = { id: 'inf_1_a', type: 'Influence', owner: '1' } as any;
                    G.objects.inf_supply_1 = { id: 'inf_supply_1', type: 'Influence', owner: '1' } as any;
                    G.zones['PersonalSupply:1'].items.push('inf_supply_1');
                    return G;
                }
            },
            numPlayers: 2
        });
        client.start();

        expect(client.getState().ctx.gameover).toEqual({ winner: '0' });
    });

    /** @rule CORE-01-09-04 */
    it('returns shared victory when top board Influence count is tied [CORE-01-09-04]', () => {
        registerTestPacks();
        const balanceControl = createBalanceControlGame();
        const client = Client({
            game: {
                ...balanceControl,
                setup: (ctx: any) => {
                    const G = SetupGame({ ctx });
                    G.roundSettlementDone = true;
                    G.zones[CoreZoneName.DrawPile].items = [];
                    G.zones.board_t1 = { id: 'board_t1', name: 'T1', items: ['inf_0_a'] };
                    G.zones.board_t2 = { id: 'board_t2', name: 'T2', items: ['inf_1_a'] };
                    G.zones[CoreZoneName.Board].items.push('board_t1', 'board_t2');
                    G.tiles.board_t1 = { id: 'board_t1', type: TileType.Committee };
                    G.tiles.board_t2 = { id: 'board_t2', type: TileType.Committee };
                    G.objects.inf_0_a = { id: 'inf_0_a', type: 'Influence', owner: '0' } as any;
                    G.objects.inf_1_a = { id: 'inf_1_a', type: 'Influence', owner: '1' } as any;
                    return G;
                }
            },
            numPlayers: 2
        });
        client.start();

        expect(client.getState().ctx.gameover).toEqual({ draw: true });
    });

    /** @rule CORE-01-10-01 */
    /** @rule CORE-01-08-04 */
    it('applies Start Committee tile-specific prohibition over generic placeInfluence action [CORE-01-10-01, CORE-01-08-04]', () => {
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_start' });
        expect(result).toBe(INVALID_MOVE);
    });
});
