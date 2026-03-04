import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { EffectResolver } from '../../../engine/resolver';
import { formalizeInfluencePayloadSchema, validateMovePayload } from '../../../move-contracts';
import { CostSlot, hasDuplicateIds, hasOverlap, isBoardTile } from '../../shared';
import { selectDeterministicCostResourceIds } from '../../../engine/deterministic-cost';
import { allStartingInfluencePlaced, countPlayerInfluence, getInfluenceCap, returnMetaMarkerToSupply } from '../../../mechanics-turn';
import { beginPoliticalActionMove, finalizePoliticalActionMove } from './shared';

/**
 * Formalizes influence via a committee tile, creating new influence.
 * @rule CORE-01-04-13
 * @rule CORE-01-04-14
 * @rule CORE-01-04-14A
 * @rule CORE-01-04-14B
 * @rule CORE-01-04-15
 * @rule CORE-01-04-15A
 * @rule CORE-01-04-16
 * @rule CORE-01-04-17A
 * @rule CORE-01-04-18
 * @rule CORE-01-04-19
 * @rule CORE-01-08-04
 * @rule CORE-01-08-07
 * @rule CORE-01-08-08
 * @rule CORE-01-08-08A
 * @rule CORE-01-08-09
 * @rule CORE-01-08-10
 * @rule CORE-01-08-10A
 * @rule CORE-01-08-06A
 * @rule CORE-01-08-06B
 * @rule CORE-01-08-06C
 * @rule CORE-01-08-06C.1
 * @rule CORE-01-08-06F
 * @rule CORE-01-08-02
 * @rule CORE-01-08-03
 * @rule CORE-01-08-01
 * @deterministic
 * @sideEffects
 */
export const formalizeInfluence = ({ G, ctx, events }: any, payload: unknown) => {
    const validated = validateMovePayload('formalizeInfluence', formalizeInfluencePayloadSchema, payload);
    if (!validated.ok) return INVALID_MOVE;
    const { committeeTileId, paymentResourceIds: explicitResourceIds, paymentResorts, extraResourceIds } = validated.value;
    const pid = beginPoliticalActionMove({ G, ctx }, 'formalizeInfluence');
    if (pid === INVALID_MOVE) return INVALID_MOVE;

    let paymentResourceIds = explicitResourceIds;
    if (!paymentResourceIds && paymentResorts) {
        // Resolve paymentResorts to deterministic resource IDs
        const slots = paymentResorts.map(resort => (resort === 'ANY' ? 'ANY' : [resort]));
        paymentResourceIds = selectDeterministicCostResourceIds(G, pid, slots) ?? undefined;
    }

    if (!paymentResourceIds) return INVALID_MOVE;

    const tile = G.tiles[committeeTileId];
    const isStartCommittee = tile?.type === TileType.StartCommittee;

    if (!tile || (tile.type !== TileType.Committee && tile.type !== TileType.StartCommittee)) return INVALID_MOVE;
    if (!isBoardTile(G, committeeTileId)) return INVALID_MOVE;

    // CORE-01-08-06A: Start Committee formalization ignores external prohibitions/modifiers.
    if (!isStartCommittee && EffectResolver.isProhibited(G, 'influence.formalize', pid, committeeTileId)) return INVALID_MOVE;

    // CORE-01-08-02/03: Must place all starting influence first
    if (!allStartingInfluencePlaced(G, ctx)) return INVALID_MOVE;

    // CORE-01-08-01: Cannot exceed influence cap
    if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx)) return INVALID_MOVE;

    // CORE-01-08-07: Start Committee at most once per game per player (Generalized)
    if (isStartCommittee) {
        if (!EffectResolver.checkUsageLimit(G, 'startCommittee', pid)) return INVALID_MOVE;
    }

    if (hasDuplicateIds(paymentResourceIds)) return INVALID_MOVE;
    if (hasOverlap(paymentResourceIds, extraResourceIds)) return INVALID_MOVE;

    const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
    const supply = G.zones[supplyId];
    for (const rid of paymentResourceIds) {
        if (!supply.items.includes(rid)) return INVALID_MOVE;
        if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
    }

    const resources = paymentResourceIds.map((rid: string) => G.objects[rid]);
    const resorts = resources.map((r: any) => r.resort);
    const uniqueResorts = Array.from(new Set(resorts)) as string[];
    let paymentSlots: CostSlot[] = [];

    if (isStartCommittee) {
        // CORE-01-08-08: 3 different resorts + 1 additional resource of any resort.
        if (paymentResourceIds.length !== 4) return INVALID_MOVE;
        if (uniqueResorts.length < 3) return INVALID_MOVE;
        paymentSlots = ['ANY', 'ANY', 'ANY', 'ANY'];
    } else {
        // CORE-01-04-15: 2 resources of different resorts.
        if (paymentResourceIds.length !== 2) return INVALID_MOVE;
        if (uniqueResorts.length !== 2) return INVALID_MOVE;
        paymentSlots = ['ANY', 'ANY'];
    }

    const baseCostValidation = EffectResolver.validateCost(G, ctx, {
        playerId: pid,
        slots: paymentSlots,
        resourceIds: paymentResourceIds
    });
    if (!baseCostValidation.ok) return INVALID_MOVE;

    // CORE-01-08-06A: Start Committee ignores external cost modifiers.
    if (!isStartCommittee && !EffectResolver.checkAndPayCosts(G, pid, 'influence.formalize', committeeTileId, extraResourceIds)) return INVALID_MOVE;

    // PUSH ATOMS
    G.engine.effectQueue.push({
        kind: 'resource.pay',
        playerId: pid,
        amount: paymentResourceIds.length,
        resorts: 'ANY',
        resourceIds: paymentResourceIds
    });

    G.engine.effectQueue.push({
        kind: 'influence.formalize',
        playerId: pid,
        tileId: committeeTileId,
        resourceIds: paymentResourceIds
    });

    if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

    // CORE-01-04-09A: FormalizeInfluence does not place Meta-Marker → return to supply
    returnMetaMarkerToSupply(G, pid);

    finalizePoliticalActionMove({ G, events }, pid, {
        beforeUsageIncrement: () => {
            // Track usage (Generalized)
            if (isStartCommittee) {
                EffectResolver.incrementUsage(G, 'startCommittee', pid);
            }
        }
    });
};
