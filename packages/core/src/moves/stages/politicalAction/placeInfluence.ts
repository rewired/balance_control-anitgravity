import { INVALID_MOVE } from 'boardgame.io/core';
import { TileType } from '@balance-control/rules';
import { EffectResolver, placeInfluencePayloadSchema, validateMovePayload } from '@balance-control/game';
import { isBoardTile } from '../../shared';
import { hasInfluenceInSupply, returnMetaMarkerToSupply } from '../../../mechanics-turn';
import { beginPoliticalActionMove, finalizePoliticalActionMove } from './shared';

/**
 * Places one influence from supply onto a board tile.
 * @rule CORE-01-04-10
 * @rule CORE-01-04-11
 * @rule CORE-01-02-17D
 * @deterministic
 * @sideEffects
 */
export const placeInfluence = ({ G, ctx, events }: any, payload: unknown) => {
    const validated = validateMovePayload('placeInfluence', placeInfluencePayloadSchema, payload);
    if (!validated.ok) return INVALID_MOVE;
    const { targetTileId, extraResourceIds } = validated.value;

    const pid = beginPoliticalActionMove({ G, ctx }, 'placeInfluence');
    if (pid === INVALID_MOVE) return INVALID_MOVE;

    const tile = G.tiles[targetTileId];

    if (!tile || !isBoardTile(G, targetTileId)) return INVALID_MOVE;
    // CORE-01-08-04 / CORE-01-02-17D
    if (tile.type === TileType.StartCommittee) return INVALID_MOVE;

    // Generic Prohibition check
    if (EffectResolver.isProhibited(G, 'influence.place', pid, targetTileId)) return INVALID_MOVE;

    // CORE-01-04-11A: Must have influence in supply
    if (!hasInfluenceInSupply(G, pid)) return INVALID_MOVE;

    // Decoupled Extra Costs
    if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.place', targetTileId, extraResourceIds)) return INVALID_MOVE;

    G.engine.effectQueue.push({
        kind: 'influence.place',
        playerId: pid,
        targetTileId
    });

    if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

    // CORE-01-04-09A: PlaceInfluence does not place Meta-Marker → return to supply
    returnMetaMarkerToSupply(G, pid);

    finalizePoliticalActionMove({ G, events }, pid);
};
