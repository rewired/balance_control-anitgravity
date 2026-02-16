import { INVALID_MOVE } from 'boardgame.io/core';
import { EffectResolver } from './engine/resolver';
import { CoreZoneNames } from '@balance-control/rules';
import { lookupMeasureDeckForObjectId } from './engine/measure-deck-provider';

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

/**
 * Standard Expansion Move: Play a measure from hand.
 */
export const playMeasure = ({ G, ctx, events }: any, measureObjectId: string, targetPayload: any) => {
    const pid = ctx.currentPlayer;
    const handZone = G.zones[`PlayerHand:${pid}`];
    if (!handZone || !handZone.items.includes(measureObjectId)) return INVALID_MOVE;

    // Generic Prohibition and Limit checks
    if (EffectResolver.isProhibited(G, 'measure.play', pid)) return INVALID_MOVE;
    if (!EffectResolver.checkUsageLimit(G, 'measure.play', pid)) return INVALID_MOVE;

    G.engine.effectQueue.push({
        kind: 'measure.play' as any,
        playerId: pid,
        measureObjectId,
        ...targetPayload
    });

    EffectResolver.resolve(G, ctx);

    // Track PlayMeasure usage
    EffectResolver.incrementUsage(G, 'measure.play', pid);
};

/**
 * Standard Expansion Move: Place a countdown marker (EXP-03).
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
