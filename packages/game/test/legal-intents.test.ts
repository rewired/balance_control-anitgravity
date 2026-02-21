import { beforeEach, describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';
import { drawTileToStaging } from '../src/mechanics-draw';
import { registerTestPacks } from './_helpers/registerPacks';
import { buildMovesForConfig } from '../src/move-assembly';
import { makeDummyExpansionPack } from './_helpers/dummyPacks';
import { takeMeasure } from './_helpers/measureMoves';

function createCtx(stage: string) {
    return {
        numPlayers: 2,
        currentPlayer: '0',
        activePlayers: { '0': stage },
        random: { Shuffle: (items: string[]) => items }
    } as any;
}

function createCtxNoActivePlayers() {
    return {
        numPlayers: 2,
        currentPlayer: '0',
        random: { Shuffle: (items: string[]) => items }
    } as any;
}

function cloneGameState(G: any) {
    return JSON.parse(JSON.stringify(G));
}

function assertTakeMeasureIntent(expansionId: string, packs: any[], setupData: any) {
    registerTestPacks(packs);
    const ctx = createCtx('politicalAction');
    const G = SetupGame({ ctx, setupData });
    const intents = enumerateLegalIntents(G as any, ctx, '0');
    const intent = intents.find((entry) => entry.moveType === `${expansionId}.takeMeasure`);
    expect(intent).toBeTruthy();

    const moves = buildMovesForConfig(setupData as any);
    const move = (moves as any)[intent!.moveType];
    expect(typeof move).toBe('function');

    const cloned = cloneGameState(G);
    const events = { endTurn: () => { }, endStage: () => { }, setStage: () => { } };
    const result = move({ G: cloned, ctx, events }, intent!.payload);
    expect(result).not.toBe(INVALID_MOVE);
}

describe('enumerateLegalIntents', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('produces deterministic ordering and move-valid payloads', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        const committeeId = Object.values(G.tiles).find(tile => tile.type === TileType.Committee)?.id as string;
        G.zones[CoreZoneName.Board].items.push(committeeId);
        G.grid['1,0'] = committeeId;

        const supply = G.zones['PersonalSupply:0'];
        const influenceId = supply.items.find(itemId => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter(itemId => itemId !== influenceId);
        G.zones[committeeId].items.push(influenceId);

        const intentsA = enumerateLegalIntents(G as any, ctx, '0');
        const intentsB = enumerateLegalIntents(G as any, ctx, '0');
        expect(JSON.stringify(intentsA)).toEqual(JSON.stringify(intentsB));
        expect(intentsA.some((intent) => intent.moveType === 'pass')).toBe(false);

        const events = { endTurn: () => { }, endStage: () => { }, setStage: () => { } };
        for (const intent of intentsA) {
            const cloned = cloneGameState(G);
            const move = (CoreMoves as any)[intent.moveType];
            if (!move) continue;
            const result = move({ G: cloned, ctx, events }, intent.payload);
            expect(result).not.toBe(INVALID_MOVE);
        }
    });

    it('emits a move-valid formalizeInfluence intent payload (committeeTileId)', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });

        const committeeId = Object.values(G.tiles).find(tile => tile.type === TileType.Committee)?.id as string;
        G.zones[CoreZoneName.Board].items.push(committeeId);
        G.zones[CoreZoneName.DrawPile].items = G.zones[CoreZoneName.DrawPile].items.filter(id => id !== committeeId);
        G.grid['1,0'] = committeeId;

        // Satisfy CORE-01-08-02/03 gate: remove all starting influence from all players' PersonalSupply.
        for (const pid of ['0', '1']) {
            const supply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`];
            const startingInfluenceIds = supply.items.filter(itemId => G.objects[itemId]?.type === 'Influence' && G.objects[itemId]?.isStarting);
            supply.items = supply.items.filter(itemId => !startingInfluenceIds.includes(itemId));
            G.zones[committeeId].items.push(...startingInfluenceIds);
        }

        // Provide exactly two payment resources of different resorts in PersonalSupply:0.
        const resourceA = 'res_dom_0';
        const resourceB = 'res_for_0';
        G.objects[resourceA] = { id: resourceA, type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects[resourceB] = { id: resourceB, type: 'Resource', owner: '0', resort: 'FOR' } as any;
        G.zones[`${CoreZoneName.PersonalSupply}:0`].items.push(resourceA, resourceB);

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        const formalize = intents.find(intent => intent.moveType === 'formalizeInfluence');
        expect(formalize).toBeTruthy();

        const events = { endTurn: () => { }, endStage: () => { }, setStage: () => { } };
        const cloned = cloneGameState(G);
        const result = CoreMoves.formalizeInfluence({ G: cloned, ctx, events } as any, formalize!.payload);
        expect(result).not.toBe(INVALID_MOVE);
    });

    it('does not emit moveInfluence intents involving Start Committee', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        const committeeId = Object.values(G.tiles).find(tile => tile.type === TileType.Committee)?.id as string;
        G.zones[CoreZoneName.Board].items.push(committeeId);
        G.grid['1,0'] = committeeId;

        const supply = G.zones['PersonalSupply:0'];
        const startInfluenceId = supply.items.find(itemId => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter(itemId => itemId !== startInfluenceId);
        G.zones['tile_start_committee'].items.push(startInfluenceId);

        const otherInfluenceId = supply.items.find(itemId => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter(itemId => itemId !== otherInfluenceId);
        G.zones[committeeId].items.push(otherInfluenceId);

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        const moveIntents = intents.filter(intent => intent.moveType === 'moveInfluence');
        const hasStartCommittee = moveIntents.some(intent => {
            return intent.payload?.sourceId === 'tile_start_committee' || intent.payload?.targetId === 'tile_start_committee';
        });
        expect(hasStartCommittee).toBe(false);
    });

    it('emits convertResources intents only when Grassroots is controlled', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        // Use Typed Grassroots (2:1) so 2 resources suffice
        const grassrootsId = Object.values(G.tiles).find(
            tile => tile.type === TileType.Grassroots && (tile.conversion?.inputSlots === 2 || tile.resort)
        )?.id as string;
        G.zones[CoreZoneName.Board].items.push(grassrootsId);
        G.grid['1,0'] = grassrootsId;

        let intents = enumerateLegalIntents(G as any, ctx, '0');
        let hasConvert = intents.some(intent => intent.moveType === 'convertResources');
        expect(hasConvert).toBe(false);

        const resourceA = 'res_dom_0';
        const resourceB = 'res_for_0';
        G.objects[resourceA] = { id: resourceA, type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects[resourceB] = { id: resourceB, type: 'Resource', owner: '0', resort: 'FOR' } as any;
        G.zones['PersonalSupply:0'].items.push(resourceA, resourceB);

        const supply = G.zones['PersonalSupply:0'];
        const influenceId = supply.items.find(itemId => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter(itemId => itemId !== influenceId);
        G.zones[grassrootsId].items.push(influenceId);

        intents = enumerateLegalIntents(G as any, ctx, '0');
        hasConvert = intents.some(intent => intent.moveType === 'convertResources');
        expect(hasConvert).toBe(true);
    });

    it('limits intents to resolveChoice when pending choice exists', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        G.engine.pendingChoice = {
            choiceId: 'choice_1',
            sourceId: 'test',
            player: '0',
            kind: 'yesNo',
            spec: { prompt: 'continue?' }
        };

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        const moveTypes = new Set(intents.map(intent => intent.moveType));
        expect(moveTypes).toEqual(new Set(['resolveChoice']));
        expect(intents).toHaveLength(2);
    });

    it('emits draw-and-place intents even when ctx.activePlayers is missing (best-effort stage)', () => {
        const ctx = createCtxNoActivePlayers();
        const G = SetupGame({ ctx });
        drawTileToStaging(G as any, ctx);

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        expect(intents.some(intent => intent.moveType === 'placeTile')).toBe(true);
    });

    it('respects global prohibitions when enumerating draw-and-place intents', () => {
        const ctx = createCtx('drawAndPlace');
        const G = SetupGame({ ctx });
        drawTileToStaging(G as any, ctx);
        G.engine.attributes.prohibitions['placeTile'] = true;
        G.engine.attributes.prohibitions['placeResort'] = true;

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        expect(intents).toHaveLength(0);
    });

    it('omits placeInfluence intents when supply has no influence', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });

        // Remove all influence from supply
        const supply = G.zones['PersonalSupply:0'];
        supply.items = supply.items.filter(id => G.objects[id]?.type !== 'Influence');

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        const hasPlace = intents.some(i => i.moveType === 'placeInfluence');
        expect(hasPlace).toBe(false);
    });


    function createMeasureDummyPack(id: string) {
        const zones = {
            drawPileId: `${id}_MeasureDrawPile`,
            openZoneId: `${id}_OpenMeasures`,
            recyclePileId: `${id}_MeasureRecyclePile`,
            finalDiscardId: `${id}_MeasureFinalDiscard`
        };
        return makeDummyExpansionPack({
            id,
            moves: { [`${id}.takeMeasure`]: takeMeasure },
            zones: Object.values(zones),
            measureDecks: [{
                id: 'measures',
                objectIdPrefix: `${id}_measure_`,
                zones
            }],
            setup: {
                preShuffle: (G: any, ctx: any) => {
                    Object.values(zones).forEach(zoneId => {
                        G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };
                    });
                    // Populate open zone so intents can be found
                    const openZone = G.zones[zones.openZoneId];
                    const measureId = `${id}_measure_1`;
                    openZone.items.push(measureId);
                    G.objects[measureId] = { id: measureId, type: 'Measure' };

                    // Initialize PlayerHand for current player so move execution is valid
                    // (Assuming test player is '0')
                    const handId = `PlayerHand:0`;
                    if (!G.zones[handId]) {
                        G.zones[handId] = { id: handId, name: handId, items: [] };
                    }
                }
            }
        });
    }

    it('enumerates exp01 takeMeasure intents when exp01 is enabled', () => {
        assertTakeMeasureIntent(
            'exp01',
            [createMeasureDummyPack('exp01')],
            { expansions: { ex01: true, ex02: false, ex03: false } }
        );
    });

    it('enumerates exp02 takeMeasure intents when exp02 is enabled', () => {
        assertTakeMeasureIntent(
            'exp02',
            [createMeasureDummyPack('exp02')],
            { expansions: { ex01: false, ex02: true, ex03: false } }
        );
    });

    it('enumerates exp03 takeMeasure intents when exp03 is enabled', () => {
        assertTakeMeasureIntent(
            'exp03',
            [createMeasureDummyPack('exp03')],
            { expansions: { ex01: false, ex02: false, ex03: true } }
        );
    });
    describe('Return Penalty', () => {
        it('selects deterministic extraResourceIds for moveInfluence and executes validly', () => {
            const ctx = createCtx('politicalAction');
            const G = SetupGame({ ctx });

            const sourceId = 'tile_resort_0';
            const targetId = 'tile_committee_1';

            G.zones[CoreZoneName.Board].items.push(sourceId, targetId);
            G.grid['0,0'] = sourceId;
            G.grid['0,1'] = targetId;
            G.adjacency[sourceId] = [targetId];
            G.adjacency[targetId] = [sourceId];

            G.tiles[sourceId] = { id: sourceId, type: TileType.Resort, resort: 'DOM' } as any;
            G.tiles[targetId] = { id: targetId, type: TileType.Committee } as any;
            G.zones[targetId] = { id: targetId, items: [] } as any; // FIX: Initialize target zone

            // Place Influence on Source
            const supply = G.zones['PersonalSupply:0'];
            const influenceId = supply.items.find(id => G.objects[id]?.type === 'Influence') as string;
            supply.items = supply.items.filter(id => id !== influenceId);

            if (!G.zones[sourceId]) G.zones[sourceId] = { id: sourceId, items: [] } as any;
            G.zones[sourceId].items.push(influenceId);

            // Set MetaMarker to ReturnPenalty on Target
            // We simulate the marker being on targetId in ReturnPenalty mode
            // Reuse existing marker if present to avoid finding the wrong one
            let markerId = Object.keys(G.objects).find(id => G.objects[id]?.type === 'MetaMarker' && G.objects[id]?.owner === '0');
            if (!markerId) {
                markerId = 'MetaMarker:0';
                G.objects[markerId] = { id: markerId, type: 'MetaMarker', owner: '0' } as any;
            }
            const marker = G.objects[markerId] as any;
            marker.mode = 'ReturnPenalty';
            marker.tileId = targetId;

            // Move marker to target zone
            Object.values(G.zones).forEach((zone: any) => {
                const idx = zone.items.indexOf(markerId);
                if (idx >= 0) zone.items.splice(idx, 1);
            });
            G.zones[targetId].items.push(markerId);

            // Ensure supply has resources for penalty (N=min(10, floor(R/2))). R=3 => N=1.
            const r1 = 'res_1', r2 = 'res_2', r3 = 'res_3';
            G.objects[r1] = { id: r1, type: 'Resource', owner: '0', resort: 'DOM' } as any;
            G.objects[r2] = { id: r2, type: 'Resource', owner: '0', resort: 'DOM' } as any;
            G.objects[r3] = { id: r3, type: 'Resource', owner: '0', resort: 'DOM' } as any;
            supply.items.push(r1, r2, r3);

            // Determinism check: call twice
            const intentsA = enumerateLegalIntents(G as any, ctx, '0');
            const intentsB = enumerateLegalIntents(G as any, ctx, '0');
            expect(JSON.stringify(intentsA)).toEqual(JSON.stringify(intentsB));

            const moveIntent = intentsA.find(i =>
                i.moveType === 'moveInfluence' &&
                i.payload.sourceId === sourceId &&
                i.payload.targetId === targetId
            );

            expect(moveIntent).toBeDefined();
            // Should have automatically selected 1 resource for penalty
            expect(moveIntent?.payload.extraResourceIds).toBeDefined();
            expect(moveIntent?.payload.extraResourceIds.length).toBe(1);

            const events = { endTurn: () => { }, endStage: () => { }, setStage: () => { } };
            const result = CoreMoves.moveInfluence({ G, ctx, events } as any, moveIntent!.payload);
            expect(result).not.toBe(INVALID_MOVE);
        });
    });

    describe('Usage Gating', () => {
        it('omits political intents when usage limit is exhausted', () => {
            const ctx = createCtx('politicalAction');
            const G = SetupGame({ ctx });

            // Force usage exhausted
            if (!G.engine.attributes.usage) G.engine.attributes.usage = {};
            // Default limit is 1. Setting usage to 1 should block further actions.
            G.engine.attributes.usage['politicalAction:0'] = 1;

            const intents = enumerateLegalIntents(G as any, ctx, '0');

            const politicalTypes = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources'];
            const hasPolitical = intents.some(i => politicalTypes.includes(i.moveType));
            expect(hasPolitical).toBe(false);
        });
    });

    describe('Intent Budget Cap', () => {
        it('deterministically caps massive intent explosions', () => {
            const ctx = createCtx('politicalAction');
            const G = SetupGame({ ctx });

            // Create a Grassroots tile with high combinatorial conversion
            // 5 input slots from many resources -> huge number of combinations
            const tileId = 'tile_grassroots_explosion';
            G.zones[CoreZoneName.Board].items.push(tileId);
            G.grid['0,0'] = tileId;
            G.tiles[tileId] = {
                id: tileId,
                type: TileType.Grassroots,
                conversion: { inputSlots: 3 }, // 3 slots
                resort: null // Untyped
            } as any;

            // Give player control
            const influenceId = 'inf_control_0';
            G.objects[influenceId] = { id: influenceId, type: 'Influence', owner: '0' } as any;
            if (!G.zones[tileId]) G.zones[tileId] = { id: tileId, items: [] } as any;
            G.zones[tileId].items.push(influenceId);

            // Give player many resources to generate combinations
            // 20 resources. nCr(20, 3) = 1140.
            // x3 output resorts = 3420 intents.
            // Should exceed 2000 cap.
            const supply = G.zones['PersonalSupply:0'];
            for (let i = 0; i < 20; i++) {
                const rid = `res_expl_${i}`;
                G.objects[rid] = { id: rid, type: 'Resource', owner: '0', resort: 'DOM' } as any;
                supply.items.push(rid);
            }

            const intentsA = enumerateLegalIntents(G as any, ctx, '0');
            const intentsB = enumerateLegalIntents(G as any, ctx, '0');

            expect(intentsA.length).toBe(2000); // verify exact cap
            expect(intentsA.length).toBeLessThan(4000); // verify we actually generated enough to be capped

            // Determinism check
            expect(JSON.stringify(intentsA)).toEqual(JSON.stringify(intentsB));

            // Verify they are sorted before cut (first item should be convertResources)
            expect(intentsA[0].moveType).toBe('convertResources');
        });
    });
});
