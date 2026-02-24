import { INVALID_MOVE } from 'boardgame.io/core';
import { EffectResolver } from '../../../engine/resolver';
import { POLITICAL_ACTION_STAGE, requireStage } from '../../shared';

type PoliticalActionCtx = {
    G: any;
    ctx: any;
    events: any;
};

type FinalizeOptions = {
    beforeUsageIncrement?: () => void;
};

/**
 * Asserts stage and turn-scoped usage availability for political actions.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function beginPoliticalActionMove({ G, ctx }: Pick<PoliticalActionCtx, 'G' | 'ctx'>, moveName: string): string | typeof INVALID_MOVE {
    const playerId = ctx.currentPlayer;
    if (!requireStage(ctx, POLITICAL_ACTION_STAGE, moveName)) return INVALID_MOVE;
    if (!EffectResolver.checkUsageLimit(G, 'politicalAction', playerId)) return INVALID_MOVE;
    return playerId;
}

/**
 * Applies canonical successful-political-action finalization order.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function finalizePoliticalActionMove(
    { G, events }: Pick<PoliticalActionCtx, 'G' | 'events'>,
    playerId: string,
    options?: FinalizeOptions
) {
    options?.beforeUsageIncrement?.();
    EffectResolver.incrementUsage(G, 'politicalAction', playerId);
    events.endTurn();
}

