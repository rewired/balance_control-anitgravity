import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { computeMajority } from '../../../mechanics';
import { EffectResolver } from '../../../engine/resolver';
import { resolveProvidedOrDeterministicResourceIds, validateDistinctCostBuckets } from '../../../engine/cost-bucket-utils';
import { convertResourcesPayloadSchema, validateMovePayload } from '../../../move-contracts';
import {
    CostSlot,
    getGrassrootsConversionSpec,
    isBoardTile,
    isCoreResort,
    placeMetaMarkerOnTile,
} from '../../shared';
import { getPlayerMetaMarker } from '../../../state-lookup';
import { beginPoliticalActionMove, finalizePoliticalActionMove } from './shared';

/**
 * Converts resources via a grassroots tile.
 * @rule CORE-01-04-20
 * @rule CORE-01-04-21
 * @rule CORE-01-04-22
 * @rule CORE-01-04-22A
 * @rule CORE-01-04-22B
 * @rule CORE-01-04-22C
 * @rule CORE-01-04-22D
 * @rule CORE-01-04-22E
 * @rule CORE-01-04-22G
 * @rule CORE-01-04-22H
 * @rule CORE-01-04-22I
 * @rule CORE-01-04-22J
 * @rule CORE-01-04-22K
 * @rule CORE-01-04-22L
 * @rule CORE-01-04-22L.1
 * @deterministic
 * @sideEffects
 */
export const convertResources = ({ G, ctx, events }: any, payload: unknown) => {
    const validated = validateMovePayload('convertResources', convertResourcesPayloadSchema, payload);
    if (!validated.ok) return INVALID_MOVE;
    const { grassrootsTileId, inputCount, inputResourceIds, outputResort, extraResourceIds } = validated.value as any;
    const declaredInputCount: number | undefined = inputCount ?? inputResourceIds?.length;
    if (!declaredInputCount) return INVALID_MOVE;

    const pid = beginPoliticalActionMove({ G, ctx }, 'convertResources');
    if (pid === INVALID_MOVE) return INVALID_MOVE;
    const tile = G.tiles[grassrootsTileId];

    if (!tile || tile.type !== TileType.Grassroots) return INVALID_MOVE;
    if (!isBoardTile(G, grassrootsTileId)) return INVALID_MOVE;

    if (!isCoreResort(outputResort)) return INVALID_MOVE;

    // Generic Prohibition check
    if (EffectResolver.isProhibited(G, 'convertResources', pid, grassrootsTileId)) return INVALID_MOVE;

    // CORE-01-04-22K/22L/22L.1: Validate recipe variant and output (Typed Variant B: output ≠ T)
    const conversionSpec = getGrassrootsConversionSpec(tile, declaredInputCount, outputResort);
    if (!conversionSpec) return INVALID_MOVE;

    const { controller } = computeMajority(grassrootsTileId, G);
    if (controller !== pid) return INVALID_MOVE;

    const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
    const supply = G.zones[supplyId];
    const baseSlots: CostSlot[] = Array.from({ length: conversionSpec.inputSlots }, () => 'ANY');

    const extraCostSlots = EffectResolver.getExtraCostSlots(G, pid, 'convertResources', grassrootsTileId);
    const resolvedExtraResourceIds = resolveProvidedOrDeterministicResourceIds(
        G,
        pid,
        extraCostSlots,
        extraResourceIds,
        new Set(inputResourceIds ?? [])
    );
    if (!resolvedExtraResourceIds) return INVALID_MOVE;

    const resolvedInputResourceIds = resolveProvidedOrDeterministicResourceIds(
        G,
        pid,
        baseSlots,
        inputResourceIds,
        new Set(resolvedExtraResourceIds)
    );
    if (!resolvedInputResourceIds) return INVALID_MOVE;

    if (!validateDistinctCostBuckets([resolvedInputResourceIds, resolvedExtraResourceIds])) return INVALID_MOVE;

    for (const rid of resolvedInputResourceIds) {
        if (!supply.items.includes(rid)) return INVALID_MOVE;
        if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
    }

    if (resolvedInputResourceIds.length !== conversionSpec.inputSlots) return INVALID_MOVE;

    const baseCostValidation = EffectResolver.validateCost(G, ctx, {
        playerId: pid,
        slots: baseSlots,
        resourceIds: resolvedInputResourceIds
    });
    if (!baseCostValidation.ok) return INVALID_MOVE;

    // Decoupled Extra Costs
    // CORE-01-04-22: Always place meta-marker on conversion, even if no extra costs
    if (!EffectResolver.checkAndPayCosts(G, pid, 'convertResources', grassrootsTileId, resolvedExtraResourceIds)) return INVALID_MOVE;

    // Emit conversion atoms
    G.engine.effectQueue.push(
        { kind: 'resource.pay', playerId: pid, amount: resolvedInputResourceIds.length, resorts: 'ANY', resourceIds: resolvedInputResourceIds },
        {
            kind: 'resource.grant',
            playerId: pid,
            amount: conversionSpec.outputSlots,
            resort: outputResort as any,
            context: { source: 'convertResources', tileId: grassrootsTileId }
        }
    );
    if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

    const marker = getPlayerMetaMarker(G, pid);
    if (marker) {
        placeMetaMarkerOnTile(G, marker, grassrootsTileId, 'Convert');
    }

    finalizePoliticalActionMove({ G, events }, pid);
};
