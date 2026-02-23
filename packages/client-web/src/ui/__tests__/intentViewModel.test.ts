import { describe, expect, it } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { buildIntentViewModel, getPendingChoiceKindForPlayer } from '../useIntentViewModel';

function intent(moveType: string, payload: any = {}): LegalIntent {
    return { moveType, payload };
}

describe('intent view model', () => {
    it('nulls pendingChoice kind when not owned by playerID', () => {
        expect(getPendingChoiceKindForPlayer({ player: '0', kind: 'selectTile' }, '1')).toBeNull();
        expect(getPendingChoiceKindForPlayer({ player: '1', kind: 'selectTile' }, '1')).toBe('selectTile');
        expect(getPendingChoiceKindForPlayer(undefined, '0')).toBeNull();
    });

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
            stagedTileId: 'T1',
            pendingChoiceKind: null
        });

        expect(vm.stage).toBe('drawAndPlace');
        expect(vm.hasPendingChoice).toBe(false);
        expect(vm.drawAndPlace.placeTile.map((i) => i.payload?.targetCoord)).toEqual(['1,0', '0,0']);
        expect(vm.ghostCoords).toEqual(['0,0', '1,0']);
        expect(vm.drawAndPlace.passTilePlacement?.moveType).toBe('passTilePlacement');

        expect(vm.political.convertResources.map((i) => i.moveType)).toEqual(['convertResources']);
        expect(vm.political.others).toHaveLength(0);
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
            stagedTileId: null,
            pendingChoiceKind: null
        });

        expect(vm.stage).toBe('politicalAction');
        // passTilePlacement is specifically handled in drawAndPlace regardless of stage
        expect(vm.drawAndPlace.passTilePlacement?.moveType).toBe('passTilePlacement');
        expect(vm.political.convertResources.map((i) => i.moveType)).toEqual(['convertResources']);
        expect(vm.political.others).toHaveLength(0);
    });

    it('excludes placeInfluence and moveInfluence from others', () => {
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
            stagedTileId: null,
            pendingChoiceKind: null
        });

        // influence actions are now handled by modes in ActionDock, so they are excluded from others
        expect(vm.political.others.map((i) => i.moveType)).toEqual([]);
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
            stagedTileId: null,
            pendingChoiceKind: 'selectTile'
        });

        expect(vm.hasPendingChoice).toBe(true);
        expect(vm.pendingChoice.kind).toBe('selectTile');
        expect(vm.pendingChoice.resolveChoice).toHaveLength(2);
        expect(vm.political.others.map((i) => i.moveType)).toEqual([]);
    });

    it('sorts others deterministically by moveType and canonical payload', () => {
        const intents: LegalIntent[] = [
            intent('z.move', { b: 1, a: 2 }),
            intent('a.move', { y: 2 }),
            intent('a.move', { x: 1 }),
        ];

        const vm = buildIntentViewModel({
            ctx: { activePlayers: { '0': 'politicalAction' } },
            playerID: '0',
            intents,
            selectedTileId: null,
            stagedTileId: null,
            pendingChoiceKind: null
        });

        // Expected order:
        // 1. a.move {x:1} (canonical: {"x":1})
        // 2. a.move {y:2} (canonical: {"y":2}) - "x" < "y" ? No.
        // Wait, canonicalJsonStringify({"x":1}) is '{"x":1}'
        // canonicalJsonStringify({"y":2}) is '{"y":2}'
        // '{"x":1}' < '{"y":2}' because "x" < "y".

        // 3. z.move {a:2, b:1} (canonical: {"a":2,"b":1})

        expect(vm.political.others).toHaveLength(3);
        expect(vm.political.others[0]).toEqual(intent('a.move', { x: 1 }));
        expect(vm.political.others[1]).toEqual(intent('a.move', { y: 2 }));
        expect(vm.political.others[2]).toEqual(intent('z.move', { a: 2, b: 1 }));
    });
});
