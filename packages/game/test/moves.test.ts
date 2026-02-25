import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreMoves } from '../src/moves';
import { GameState, TileType, CoreZoneName } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';
import { registerTestPacks } from './_helpers/registerPacks';
import { EnginePackRegistry } from '../src/expansion-registry';
import { getInfluenceCap } from '../src/mechanics-turn';

describe('Moves', () => {
    let G: GameState;
    let ctx: any;
    let events: any;

    const resetHarness = () => {
        registerTestPacks();
        events = { endTurn: () => { }, endStage: () => { } };
        G = {
            zones: {
                [CoreZoneName.Board]: { id: CoreZoneName.Board, name: 'Board', items: ['board_t1', 'board_t2', 'board_gr', 'board_start'] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['meta_p1', 'inf_1', 'res_dom', 'res_dom_2', 'res_for', 'res_inf'] },
                board_t1: { id: 'board_t1', name: 'T1', items: [] },
                board_t2: { id: 'board_t2', name: 'T2', items: [] },
                board_gr: { id: 'board_gr', name: 'GR', items: [] },
                board_start: { id: 'board_start', name: 'Start', items: [] },
                offboard_t: { id: 'offboard_t', name: 'Offboard', items: [] },
                Bank: { id: 'Bank', name: 'Bank', items: ['res_inf_bank'] }
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
                board_start: { id: 'board_start', type: TileType.StartCommittee },
                offboard_t: { id: 'offboard_t', type: TileType.Lobbyist }
            },
            objects: {
                meta_p1: { id: 'meta_p1', type: 'MetaMarker', owner: 'p1' },
                inf_1: { id: 'inf_1', type: 'Influence', owner: 'p1' },
                res_dom: { id: 'res_dom', type: 'Resource', owner: 'p1', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', owner: 'p1', resort: 'DOM' },
                res_for: { id: 'res_for', type: 'Resource', owner: 'p1', resort: 'FOR' },
                res_inf: { id: 'res_inf', type: 'Resource', owner: 'p1', resort: 'INF' },
                res_inf_bank: { id: 'res_inf_bank', type: 'Resource', resort: 'INF' }
            },
            adjacency: {
                board_t1: ['board_t2', 'board_gr', 'board_start'],
                board_t2: ['board_t1', 'board_gr', 'board_start'],
                board_gr: ['board_t1', 'board_t2', 'board_start'],
                board_start: ['board_t1', 'board_t2', 'board_gr']
            },
            grid: {},
            engine: {
                idSeq: 0,
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {
                    limits: { startCommittee: 1 },
                    usage: {},
                    prohibitions: {},
                    tileExtraCosts: {},
                    playerExtraCosts: {},
                    climateCostRules: [],
                }
            }
        } as any;

        ctx = {
            currentPlayer: 'p1',
            numPlayers: 2,
            activePlayers: { p1: 'politicalAction' }
        };
    };

    const seedPlayerInfluenceToCount = (targetCount: number) => {
        const currentCount = Object.values(G.objects).filter((obj: any) => obj.type === 'Influence' && obj.owner === 'p1').length;
        for (let i = currentCount + 1; i <= targetCount; i++) {
            const infId = `inf_cap_${i}`;
            G.objects[infId] = { id: infId, type: 'Influence', owner: 'p1' } as any;
            G.zones.board_t1.items.push(infId);
        }
    };

    const seedPlayerInfluenceToCap = () => {
        seedPlayerInfluenceToCount(getInfluenceCap(ctx));
    };

    const countOwnedInfluence = () =>
        Object.values(G.objects).filter((obj: any) => obj.type === 'Influence' && obj.owner === 'p1').length;

    const assertZoneExclusivity = (state: GameState) => {
        const membership: Record<string, number> = {};
        for (const zone of Object.values(state.zones)) {
            for (const itemId of zone.items) {
                membership[itemId] = (membership[itemId] || 0) + 1;
            }
        }
        for (const objectId of Object.keys(state.objects)) {
            expect(membership[objectId]).toBe(1);
        }
    };

    beforeEach(resetHarness);

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('placeInfluence should work on a non-Lobbyist board tile', () => {
        CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t2' });

        expect(G.zones['PersonalSupply:p1'].items.includes('inf_1')).toBe(false);
        expect(G.zones.board_t2.items).toContain('inf_1');
    });

    it('placeInfluence should reject non-board targets without mutation', () => {
        const before = JSON.stringify(G);
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'offboard_t' });
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('moveInfluence should reject non-board targets without mutation', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');

        const before = JSON.stringify(G);
        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'offboard_t' });
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('moveInfluence should remain legal at cap because it only relocates markers', () => {
        // CORE-01-04-12: relocation remains legal at cap because legality is checked before mutation and no new Influence is created.
        seedPlayerInfluenceToCap();
        const beforeCount = countOwnedInfluence();
        const cap = getInfluenceCap(ctx);
        const queueBefore = G.engine.effectQueue.length;
        const historyBefore = G.engine.history.length;
        const sourceBefore = G.zones.board_t1.items.filter((id: string) => G.objects[id]?.type === 'Influence').length;
        const targetBefore = G.zones.board_t2.items.filter((id: string) => G.objects[id]?.type === 'Influence').length;

        expect(beforeCount).toBe(cap);
        expect(queueBefore).toBe(0);
        expect(historyBefore).toBe(0);

        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.engine.effectQueue).toHaveLength(0);
        expect(G.engine.history).toHaveLength(historyBefore + 1);
        expect(G.engine.history[historyBefore]).toMatchObject({ atom: 'influence.move' });
        const sourceInfluence = G.zones.board_t1.items.filter((id: string) => G.objects[id]?.type === 'Influence').length;
        const targetInfluence = G.zones.board_t2.items.filter((id: string) => G.objects[id]?.type === 'Influence').length;
        expect(sourceInfluence).toBe(sourceBefore - 1);
        expect(targetInfluence).toBe(targetBefore + 1);
        expect(countOwnedInfluence()).toBe(beforeCount);
    });

    it('moveInfluence should set ReturnPenalty mode when meta-marker starts on destination', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'meta_p1');
        G.zones.board_t2.items.push('meta_p1');

        CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(G.zones.board_t1.items).toContain('meta_p1');
        expect(G.zones.board_t2.items).not.toContain('meta_p1');
        expect(G.objects.meta_p1.mode).toBe('ReturnPenalty');
    });

    it('moveInfluence should require and apply Return Penalty resources to Noise (CORE-01-04-12B)', () => {
        G.roundNumber = 1;
        (G.zones as any).Noise = { id: 'Noise', name: 'Noise', items: [] };

        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'meta_p1');
        G.zones.board_t2.items.push('meta_p1');
        (G.objects.meta_p1 as any).mode = 'ReturnPenalty';

        const before = JSON.stringify(G);
        const invalid = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });
        expect(invalid).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);

        const result = CoreMoves.moveInfluence(
            { G, ctx, events },
            { sourceId: 'board_t1', targetId: 'board_t2', extraResourceIds: ['res_dom', 'res_for'] }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones.Noise.items).toEqual(expect.arrayContaining(['res_dom', 'res_for']));
        expect(G.zones['PersonalSupply:p1'].items).not.toContain('res_dom');
        expect(G.zones['PersonalSupply:p1'].items).not.toContain('res_for');
        expect(G.zones.board_t2.items).toContain('inf_1');
        expect(G.zones.board_t1.items).toContain('meta_p1');
        expect(G.zones.board_t2.items).not.toContain('meta_p1');
    });

    it('moveInfluence should set ReturnPenalty mode when source is ResortTile (CORE-01-04-12A)', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');

        CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(G.zones.board_t1.items).toContain('meta_p1');
        expect(G.objects.meta_p1.mode).toBe('ReturnPenalty');
    });

    it('moveInfluence should preserve zone exclusivity', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');

        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        assertZoneExclusivity(G);
    });

    it('moveInfluence should reject Start Committee as source or destination', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_start.items.push('inf_1');
        const beforeSource = JSON.stringify(G);
        const resultSource = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_start', targetId: 'board_t2' });
        expect(resultSource).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(beforeSource);

        G.zones.board_start.items = [];
        G.zones.board_t1.items.push('inf_1');
        const beforeTarget = JSON.stringify(G);
        const resultTarget = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_start' });
        expect(resultTarget).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(beforeTarget);
    });

    it('moveInfluence should allow Start-Bridge move (A -> Start -> B) (CORE-01-04-12D)', () => {
        // Setup: board_t1 and board_t2 are NOT directly adjacent, but both adjacent to board_start
        G.adjacency = {
            board_t1: ['board_start'],
            board_t2: ['board_start'],
            board_start: ['board_t1', 'board_t2']
        };

        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');

        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones.board_t2.items).toContain('inf_1');
        expect(G.zones.board_t1.items).not.toContain('inf_1');
    });

    it('placeInfluence should remain legal at cap because it uses existing supply marker', () => {
        // CORE-01-04-11: relocation from PersonalSupply remains legal at cap because this move repositions an existing marker instead of creating one.
        seedPlayerInfluenceToCap();
        const beforeCount = countOwnedInfluence();

        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones['PersonalSupply:p1'].items.includes('inf_1')).toBe(false);
        expect(G.zones.board_t2.items).toContain('inf_1');
        expect(countOwnedInfluence()).toBe(beforeCount);
    });

    it('formalizeInfluence should enforce different-resort cost on standard Committee', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_dom_2'];

        const before = JSON.stringify(G);
        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_dom_2'] }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('formalizeInfluence should be rejected at cap without partial mutation', () => {
        seedPlayerInfluenceToCount(getInfluenceCap(ctx));
        const before = JSON.stringify(G);

        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('formalizeInfluence should enforce Start Committee special cost', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'res_inf', 'res_dom_2'];

        const beforeFail = JSON.stringify(G);
        const fail = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_dom_2'] }
        );
        expect(fail).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(beforeFail);

        CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_inf', 'res_dom_2'] }
        );

        expect(G.zones.Bank.items).toContain('res_dom');
        expect(G.zones.Bank.items).toContain('res_for');
        expect(G.zones.Bank.items).toContain('res_inf');
        expect(G.zones.Bank.items).toContain('res_dom_2');
        // CORE-01-04-09A: formalizeInfluence returns Meta-Marker to supply → 2 items (new Influence + meta)
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(2);
        const infIds = G.zones['PersonalSupply:p1'].items.filter((id: string) => G.objects[id]?.type === 'Influence');
        expect(infIds).toHaveLength(1);
    });

    it('formalizeInfluence should ignore prohibitions on Start Committee', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'res_inf', 'res_dom_2'];
        G.engine.attributes.prohibitions = { 'influence.formalize': true };

        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_inf', 'res_dom_2'] }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones.Bank.items).toContain('res_dom');
        expect(G.zones.Bank.items).toContain('res_for');
        expect(G.zones.Bank.items).toContain('res_inf');
        expect(G.zones.Bank.items).toContain('res_dom_2');
    });

    it('convertResources should follow grassroots conversion spec without formalizing influence', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'inf_1'];
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
        G.zones.board_gr.items.push('inf_1');

        CoreMoves.convertResources(
            { G, ctx, events },
            { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
        );

        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(1);
        const grantedId = G.zones['PersonalSupply:p1'].items[0];
        expect(G.objects[grantedId].type).toBe('Resource');
        expect(G.objects[grantedId].resort).toBe('INF');
    });

    it('convertResources should reject when no controlled Grassroots tile exists', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for'];
        const before = JSON.stringify(G);

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('convertResources should auto-pay extra cost when meta-marker is in Convert mode', () => {
        G.roundNumber = 2;
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'res_inf', 'inf_1', 'meta_p1'];
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'meta_p1');
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
        G.zones.board_gr.items.push('inf_1');
        G.zones.board_t1.items.push('meta_p1');
        G.objects.meta_p1.mode = 'Convert';

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            {
                grassrootsTileId: 'board_gr',
                inputResourceIds: ['res_dom', 'res_for'],
                outputResort: 'INF',
            }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones['PersonalSupply:p1'].items).not.toContain('res_inf'); // auto-paid extra cost
    });

    it('convertResources should place meta-marker on the anchor with Convert mode', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'inf_1', 'meta_p1'];
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
        G.zones.board_gr.items.push('inf_1');

        CoreMoves.convertResources(
            { G, ctx, events },
            { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
        );

        expect(G.zones.board_gr.items).toContain('meta_p1');
        expect(G.objects.meta_p1.mode).toBe('Convert');
    });

    it('convertResources should preserve zone exclusivity', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'inf_1', 'meta_p1'];
        G.zones.Bank.items = ['res_inf_bank', 'res_dom_2', 'res_inf'];
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
        G.zones.board_gr.items.push('inf_1');

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
        );

        expect(result).not.toBe(INVALID_MOVE);
        assertZoneExclusivity(G);
    });

    it('formalizeInfluence should allow up to cap for 5 players', () => {
        ctx.numPlayers = 5;
        const cap = getInfluenceCap(ctx);
        seedPlayerInfluenceToCount(cap - 1);

        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(countOwnedInfluence()).toBe(cap);
    });

    it('formalizeInfluence should reject at cap for 5 players without mutation', () => {
        ctx.numPlayers = 5;
        seedPlayerInfluenceToCount(getInfluenceCap(ctx));

        const before = JSON.stringify(G);
        // CORE-01-04-09: creation at cap is illegal because cap legality is validated before the move would create a new Influence.
        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('placeInfluence should reject malformed payload without mutation', () => {
        const before = JSON.stringify(G);
        const result = CoreMoves.placeInfluence({ G, ctx, events }, 'board_t1' as any);
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('placeInfluence should be rejected when PersonalSupply has no Influence', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => G.objects[id]?.type !== 'Influence');
        const before = JSON.stringify(G);
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t1' });

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('political actions should reject when not in POLITICAL_ACTION_STAGE', () => {
        const setMoveSeedState = (move: 'placeInfluence' | 'moveInfluence' | 'formalizeInfluence' | 'convertResources') => {
            if (move === 'moveInfluence') {
                G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
                G.zones.board_t1.items.push('inf_1');
            }

            if (move === 'convertResources') {
                G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'inf_1'];
                G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
                G.zones.board_gr.items.push('inf_1');
            }
        };

        const run = (move: 'placeInfluence' | 'moveInfluence' | 'formalizeInfluence' | 'convertResources') => {
            const localEvents = { endTurn: vi.fn(), endStage: vi.fn() };
            ctx.activePlayers = { p1: 'drawAndPlace' };
            setMoveSeedState(move);
            const before = JSON.stringify(G);

            if (move === 'placeInfluence') {
                return { result: CoreMoves.placeInfluence({ G, ctx, events: localEvents }, { targetTileId: 'board_t2' }), before, localEvents };
            }
            if (move === 'moveInfluence') {
                return { result: CoreMoves.moveInfluence({ G, ctx, events: localEvents }, { sourceId: 'board_t1', targetId: 'board_t2' }), before, localEvents };
            }
            if (move === 'formalizeInfluence') {
                return {
                    result: CoreMoves.formalizeInfluence(
                        { G, ctx, events: localEvents },
                        { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
                    ),
                    before,
                    localEvents
                };
            }
            return {
                result: CoreMoves.convertResources(
                    { G, ctx, events: localEvents },
                    { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
                ),
                before,
                localEvents
            };
        };

        for (const move of ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources'] as const) {
            resetHarness();
            const { result, before, localEvents } = run(move);
            expect(result).toBe(INVALID_MOVE);
            expect(JSON.stringify(G)).toBe(before);
            expect(localEvents.endTurn).not.toHaveBeenCalled();
        }
    });

    it('political actions should reject when usage is exhausted', () => {
        G.engine.attributes.limits.politicalAction = 1;
        G.engine.attributes.usage = { p1: { politicalAction: 1 }, politicalAction: 1 } as any;

        const localEvents = { endTurn: vi.fn(), endStage: vi.fn() };

        expect(CoreMoves.placeInfluence({ G, ctx, events: localEvents }, { targetTileId: 'board_t2' })).toBe(INVALID_MOVE);

        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');
        expect(CoreMoves.moveInfluence({ G, ctx, events: localEvents }, { sourceId: 'board_t1', targetId: 'board_t2' })).toBe(INVALID_MOVE);

        expect(
            CoreMoves.formalizeInfluence(
                { G, ctx, events: localEvents },
                { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
            )
        ).toBe(INVALID_MOVE);

        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'inf_1'];
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter(id => id !== 'inf_1');
        G.zones.board_gr.items.push('inf_1');
        expect(
            CoreMoves.convertResources(
                { G, ctx, events: localEvents },
                { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
            )
        ).toBe(INVALID_MOVE);

        expect(localEvents.endTurn).not.toHaveBeenCalled();
        expect(G.engine.attributes.usage.p1.politicalAction).toBe(1);
    });

    it('political action success should increment usage and end turn', () => {
        const localEvents = { endTurn: vi.fn(), endStage: vi.fn() };

        const result = CoreMoves.placeInfluence({ G, ctx, events: localEvents }, { targetTileId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.engine.attributes.usage.p1.politicalAction).toBe(1);
        expect(G.engine.attributes.usage.politicalAction).toBe(1);
        expect(localEvents.endTurn).toHaveBeenCalledTimes(1);
    });

});
