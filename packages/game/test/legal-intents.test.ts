import { describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, TileType } from '@balance-control/rules';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';

function createCtx(stage: string) {
    return {
        numPlayers: 2,
        currentPlayer: '0',
        activePlayers: { '0': stage }
    } as any;
}

function cloneGameState(G: any) {
    return JSON.parse(JSON.stringify(G));
}

describe('enumerateLegalIntents', () => {
    it('produces deterministic ordering and move-valid payloads', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        const committeeId = Object.values(G.tiles).find(tile => tile.type === TileType.Committee)?.id as string;
        G.zones[CoreZoneNames.Board].items.push(committeeId);
        G.grid['1,0'] = committeeId;

        const supply = G.zones['PersonalSupply:0'];
        const influenceId = supply.items.find(itemId => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter(itemId => itemId !== influenceId);
        G.zones[committeeId].items.push(influenceId);

        const intentsA = enumerateLegalIntents(G as any, ctx, '0');
        const intentsB = enumerateLegalIntents(G as any, ctx, '0');
        expect(JSON.stringify(intentsA)).toEqual(JSON.stringify(intentsB));

        const events = { endTurn: () => {}, endStage: () => {}, setStage: () => {} };
        for (const intent of intentsA) {
            const cloned = cloneGameState(G);
            const move = (CoreMoves as any)[intent.moveType];
            if (!move) continue;
            const result = move({ G: cloned, ctx, events }, intent.payload);
            expect(result).not.toBe(INVALID_MOVE);
        }
    });

    it('does not emit moveInfluence intents involving Start Committee', () => {
        const ctx = createCtx('politicalAction');
        const G = SetupGame({ ctx });
        const committeeId = Object.values(G.tiles).find(tile => tile.type === TileType.Committee)?.id as string;
        G.zones[CoreZoneNames.Board].items.push(committeeId);
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
});
