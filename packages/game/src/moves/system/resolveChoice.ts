import { INVALID_MOVE } from 'boardgame.io/core';
import { drawTileToStaging, UNPLACEABLE_DRAW_CHOICE_SOURCE_ID } from '../../mechanics-draw';
import { EffectResolver } from '../../engine/resolver';
import { resolveChoicePayloadSchema, validateMovePayload } from '../../move-contracts';

export const SystemMoves = {
    /**
     * Resolves a pending choice for a player.
     * @remarks infrastructure; no direct SPEC binding
     * @deterministic
     * @sideEffects
     */
    resolveChoice: ({ G, ctx }: any, payload: unknown) => {
        const validated = validateMovePayload('resolveChoice', resolveChoicePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { choiceId, selection } = validated.value;

        if (!G.engine.pendingChoice || G.engine.pendingChoice.choiceId !== choiceId) return INVALID_MOVE;

        const choice = G.engine.pendingChoice;

        // Forced confirm gate for unplaceable draw loop.
        if (choice.sourceId === UNPLACEABLE_DRAW_CHOICE_SOURCE_ID && selection !== 'OK') return INVALID_MOVE;

        G.engine.pendingChoice = undefined;

        // Push resolution atom to front of queue
        G.engine.effectQueue.unshift({
            kind: 'choice.apply',
            choiceId,
            selection,
            context: choice.spec // Spec might contain the branching data
        } as any);

        EffectResolver.resolve(G, ctx);

        // CORE-01-04-07: After unplaceable discard, draw again (confirm-gated via pendingChoice).
        if (choice.sourceId === UNPLACEABLE_DRAW_CHOICE_SOURCE_ID) {
            drawTileToStaging(G, ctx);
        }
    },
};

