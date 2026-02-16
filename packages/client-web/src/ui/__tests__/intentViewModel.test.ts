import { describe, expect, it } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { buildIntentViewModel } from '../useIntentViewModel';

function intent(moveType: string, payload: any = {}): LegalIntent {
    return { moveType, payload };
}

describe('intent view model', () => {
    it('groups drawAndPlace intents and computes ghostCoords deterministically', () => {
        const intents: LegalIntent[] = [
            intent('placeTile', { targetCoord: '1,0' }),
            intent('placeTile', { targetCoord: '0,0' }),
            intent('passTilePlacement', {}),
            intent('convertResources', { outputResort: 'INF' }),
        ];

        const vm = buildIntentViewModel({
            ctx: { activePlayers: { '0': 'drawAndPlace' } },
            playerID: '0',
            intents,
            selectedTileId: null,
            stagedTileId: 'T1'
        });

        expect(vm.stage).toBe('drawAndPlace');
        expect(vm.hasPendingChoice).toBe(false);
        expect(vm.drawAndPlace.placeTile.map((i) => i.payload?.targetCoord)).toEqual(['1,0', '0,0']);
        expect(vm.ghostCoords).toEqual(['0,0', '1,0']);
        expect(vm.drawAndPlace.passTilePlacement?.moveType).toBe('passTilePlacement');

        expect(vm.political.others.map((i) => i.moveType)).toEqual(['convertResources']);
    });

    it('moves passTilePlacement to trailing actions outside drawAndPlace', () => {
        const intents: LegalIntent[] = [
            intent('convertResources', { outputResort: 'FOR' }),
            intent('passTilePlacement', {}),
        ];

        const vm = buildIntentViewModel({
            ctx: { activePlayers: { '0': 'politicalAction' } },
            playerID: '0',
            intents,
            selectedTileId: null,
            stagedTileId: null
        });

        expect(vm.stage).toBe('politicalAction');
        expect(vm.political.others.map((i) => i.moveType)).toEqual(['convertResources', 'passTilePlacement']);
    });

    it('selects placeInfluence intent for selected tile and excludes all placeInfluence from others', () => {
        const intents: LegalIntent[] = [
            intent('placeInfluence', { targetTileId: 'A' }),
            intent('placeInfluence', { targetTileId: 'B' }),
            intent('moveInfluence', { sourceId: 'x', targetId: 'y' }),
        ];

        const vm = buildIntentViewModel({
            ctx: { activePlayers: { '0': 'politicalAction' } },
            playerID: '0',
            intents,
            selectedTileId: 'A',
            stagedTileId: null
        });

        expect(vm.political.placeInfluenceForSelected?.payload?.targetTileId).toBe('A');
        expect(vm.political.others.map((i) => i.moveType)).toEqual(['moveInfluence']);
    });

    it('surfaces pending choice intents and removes resolveChoice from others', () => {
        const intents: LegalIntent[] = [
            intent('resolveChoice', { choiceId: 'c1', selection: 'x' }),
            intent('resolveChoice', { choiceId: 'c1', selection: 'y' }),
        ];

        const vm = buildIntentViewModel({
            ctx: { activePlayers: { '0': 'politicalAction' } },
            playerID: '0',
            intents,
            selectedTileId: null,
            stagedTileId: null
        });

        expect(vm.hasPendingChoice).toBe(true);
        expect(vm.pendingChoice.resolveChoice).toHaveLength(2);
        expect(vm.political.others.map((i) => i.moveType)).toEqual([]);
    });
});
