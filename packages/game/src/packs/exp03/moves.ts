import { INVALID_MOVE } from 'boardgame.io/core';
import { EffectResolver } from '../pack-api';

/**
 * Standard Expansion Move: Place a countdown marker (EXP-03).
 * @expansion EXP-03
 * @requires SPEC-CORE-01
 * @deterministic
 * @rule EXP-03-04-B
 */
export const placeCountdownMarker = ({ G, ctx }: any, { targetTileId, extraResourceIds }: { targetTileId: string, extraResourceIds?: string[] }) => {
    const pid = ctx.currentPlayer;

    // Decoupled Extra Costs
    if (!EffectResolver.checkAndPayCosts(G, pid, 'placeCountdown', targetTileId, extraResourceIds)) return INVALID_MOVE;

    G.engine.effectQueue.push({
        kind: 'countdown.place',
        targetTileId,
        amount: 3
    });

    EffectResolver.resolve(G, ctx);
};
