import { beforeEach, describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { CoreMoves } from '../src/moves';
import { drawTileToStaging, UNPLACEABLE_DRAW_CHOICE_SOURCE_ID } from '../src/mechanics-draw';
import { registerTestPacks } from './_helpers/registerPacks';

function createCtx() {
    return {
        numPlayers: 2,
        currentPlayer: '0',
        activePlayers: { '0': 'drawAndPlace' }
    } as any;
}

describe('Unplaceable draw handling', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    /** @rule CORE-01-02-03 */
    /** @rule CORE-01-04-06 */
    /** @rule CORE-01-04-07 */
    it('discards unplaceable drawn tile, logs notice, forces confirm, then redraws on confirm', () => {
        const ctx = createCtx();
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneName.DrawPile];
        const tile1 = drawPile.items[0] as string;
        const tile2 = drawPile.items[1] as string;
        drawPile.items = [tile1, tile2];

        G.engine.attributes.prohibitions['placeTile'] = true;
        G.engine.attributes.prohibitions['placeResort'] = true;

        drawTileToStaging(G as any, ctx);

        expect(G.zones[`staging_${ctx.currentPlayer}`].items).toHaveLength(0);
        expect(G.zones[CoreZoneName.DiscardFaceUp].items).toEqual([tile1]);

        const log = G.engine.attributes.publicLog as any[];
        expect(log).toHaveLength(1);
        expect(log[0]).toMatchObject({ kind: 'tile.unplaceable', playerId: '0', tileId: tile1 });
        expect(typeof log[0].id).toBe('string');

        expect(G.engine.pendingChoice).toBeDefined();
        expect(G.engine.pendingChoice?.sourceId).toBe(UNPLACEABLE_DRAW_CHOICE_SOURCE_ID);
        expect(G.engine.pendingChoice?.kind).toBe('selectOption');
        expect(G.engine.pendingChoice?.player).toBe('0');
        expect(G.engine.pendingChoice?.spec?.options).toEqual(['OK']);

        const intents = enumerateLegalIntents(G as any, ctx, '0');
        expect(intents).toHaveLength(1);
        expect(new Set(intents.map((intent) => intent.moveType))).toEqual(new Set(['resolveChoice']));

        const choiceId = G.engine.pendingChoice?.choiceId as string;
        const result = CoreMoves.resolveChoice({ G, ctx }, { choiceId, selection: 'OK' });
        expect(result).not.toBe(INVALID_MOVE);

        expect(G.zones[CoreZoneName.DiscardFaceUp].items).toEqual([tile1, tile2]);
        expect((G.engine.attributes.publicLog as any[])).toHaveLength(2);
        expect(G.engine.pendingChoice).toBeDefined();
    });

    it('stops cleanly when DrawPile is empty after confirm', () => {
        const ctx = createCtx();
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneName.DrawPile];
        const tile1 = drawPile.items[0] as string;
        drawPile.items = [tile1];

        G.engine.attributes.prohibitions['placeTile'] = true;
        G.engine.attributes.prohibitions['placeResort'] = true;

        drawTileToStaging(G as any, ctx);
        expect(G.engine.attributes.drawPileEmptyAtTurnStart).toBe(true);
        expect(G.engine.pendingChoice).toBeDefined();

        const choiceId = G.engine.pendingChoice?.choiceId as string;
        const result = CoreMoves.resolveChoice({ G, ctx }, { choiceId, selection: 'OK' });
        expect(result).not.toBe(INVALID_MOVE);

        expect(G.zones[`staging_${ctx.currentPlayer}`].items).toHaveLength(0);
        expect(G.engine.pendingChoice).toBeUndefined();
        expect(G.engine.attributes.drawPileEmptyAtTurnStart).toBe(true);
    });
});
