import { beforeEach, describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';
import { drawTileToStaging } from '../src/mechanics-draw';
import { registerTestPacks } from './_helpers/registerPacks';
import { buildMovesForConfig } from '../src/move-assembly';
import { Exp01Pack } from '../src/packs/exp01';
import { Exp02Pack } from '../src/packs/exp02';
import { Exp03Pack } from '../src/packs/exp03';

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
    const events = { endTurn: () => {}, endStage: () => {}, setStage: () => {} };
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

        const events = { endTurn: () => {}, endStage: () => {}, setStage: () => {} };
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

        const events = { endTurn: () => {}, endStage: () => {}, setStage: () => {} };
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

    it('enumerates exp01 takeMeasure intents when exp01 is enabled', () => {
        assertTakeMeasureIntent(
            'exp01',
            [Exp01Pack],
            { expansions: { ex01: true, ex02: false, ex03: false } }
        );
    });

    it('enumerates exp02 takeMeasure intents when exp02 is enabled', () => {
        assertTakeMeasureIntent(
            'exp02',
            [Exp02Pack],
            { expansions: { ex01: false, ex02: true, ex03: false } }
        );
    });

    it('enumerates exp03 takeMeasure intents when exp03 is enabled', () => {
        assertTakeMeasureIntent(
            'exp03',
            [Exp03Pack],
            { expansions: { ex01: false, ex02: false, ex03: true } }
        );
    });
});
