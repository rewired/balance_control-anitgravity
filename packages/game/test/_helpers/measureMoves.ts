import { INVALID_MOVE } from 'boardgame.io/core';
import { EffectResolver } from '../../src/engine/resolver';
import { lookupMeasureDeckForObjectId } from '../../src/engine/measure-deck-provider';

/**
 * Standard Expansion Move: Take a measure from the open display.
 * Logic is generic and depends on zone naming conventions.
 */
export const takeMeasure = ({ G, ctx, events }: any, measureObjectId: string) => {
    const pid = ctx.currentPlayer;

    let openZoneId: string;
    try {
        openZoneId = lookupMeasureDeckForObjectId(G, measureObjectId).openZoneId;
    } catch {
        return INVALID_MOVE;
    }

    const openZone = G.zones[openZoneId];
    if (!openZone || !openZone.items.includes(measureObjectId)) return INVALID_MOVE;

    const handZone = G.zones[`PlayerHand:${pid}`];
    if (!handZone) return INVALID_MOVE;

    // Generic Prohibition and Limit checks
    if (EffectResolver.isProhibited(G, 'measure.take', pid)) return INVALID_MOVE;
    if (!EffectResolver.checkUsageLimit(G, 'measure.hold', pid)) return INVALID_MOVE;

    G.engine.effectQueue.push({
        kind: 'measure.take',
        playerId: pid,
        measureObjectId
    });

    EffectResolver.resolve(G, ctx);

    // Usage tracking
    EffectResolver.incrementUsage(G, 'measure.hold', pid);
    events.endTurn();
};
