import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, TileType } from '@balance-control/rules';
import { computeMajority } from '../../mechanics';
import {
    allStartingInfluencePlaced,
    countPlayerInfluence,
    getInfluenceCap,
    returnMetaMarkerToSupply
} from '../../mechanics-turn';
import { EffectResolver } from '../../engine/resolver';
import { findObjectZoneId, getPlayerMetaMarker } from '../../state-lookup';
import {
    convertResourcesPayloadSchema,
    formalizeInfluencePayloadSchema,
    moveInfluencePayloadSchema,
    placeInfluencePayloadSchema,
    validateMovePayload
} from '../../move-contracts';
import {
    CostSlot,
    POLITICAL_ACTION_STAGE,
    getGrassrootsConversionSpec,
    hasDuplicateIds,
    hasOverlap,
    isBoardTile,
    isCoreResort,
    placeMetaMarkerOnTile,
    requireStage
} from '../shared';

export const PoliticalActionMoves = {
    // CORE-01-04-10–12: PlaceInfluence via Lobbyist
    placeInfluence: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('placeInfluence', placeInfluencePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { targetTileId, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'placeInfluence')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;

        const tile = G.tiles[targetTileId];

        if (!tile || !isBoardTile(G, targetTileId)) return INVALID_MOVE;
        if (tile.type === TileType.StartCommittee) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'influence.place', pid, targetTileId)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.place', targetTileId, extraResourceIds)) return INVALID_MOVE;

        G.engine.effectQueue.push({
            kind: 'influence.place',
            playerId: pid,
            targetTileId
        });

        if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

        // CORE-01-04-09A: PlaceInfluence does not place Meta-Marker â†’ return to supply
        returnMetaMarkerToSupply(G, pid);

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },

    // CORE-01-04-12: Move exactly one Influence from one Board Tile to another
    moveInfluence: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('moveInfluence', moveInfluencePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { sourceId, targetId, extraResourceIds = [] } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'moveInfluence')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'influence.move', pid, targetId)) return INVALID_MOVE;

        if (!isBoardTile(G, sourceId) || !isBoardTile(G, targetId)) return INVALID_MOVE;

        const srcZone = G.zones[sourceId];
        if (!srcZone) return INVALID_MOVE;

        // CORE-01-08-06E
        const sourceTile = G.tiles[sourceId];
        if (sourceTile && sourceTile.type === TileType.StartCommittee) return INVALID_MOVE;

        // CORE-01-08-04: No Influence may be placed on the Start Committee
        const targetTile = G.tiles[targetId];
        if (targetTile && targetTile.type === TileType.StartCommittee) return INVALID_MOVE;

        const hasInf = srcZone.items.some((id: string) => G.objects[id]?.owner === pid && G.objects[id].type === 'Influence');
        if (!hasInf) return INVALID_MOVE;

        if (!G.zones[targetId]) return INVALID_MOVE;

        // CORE-01-04-12B
        const marker = getPlayerMetaMarker(G, pid);
        const markerZoneId = marker ? findObjectZoneId(G, marker.id) : null;
        let penaltyCount = 0;
        if (marker && marker.mode === 'PingPong' && markerZoneId === targetId) {
            const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
            const supply = G.zones[supplyId];
            const R = supply?.items?.filter((id: string) => G.objects[id]?.type === 'Resource').length ?? 0;
            penaltyCount = Math.min(10, Math.floor(R / 2));
        }

        const extraCostSlots = EffectResolver.getExtraCostSlots(G, pid, 'influence.move', targetId, { includePingPongPenalty: false });
        const totalSlots = penaltyCount + extraCostSlots.length;

        if (totalSlots > 0) {
            if (!extraResourceIds || extraResourceIds.length !== totalSlots) return INVALID_MOVE;
            if (hasDuplicateIds(extraResourceIds)) return INVALID_MOVE;
        }

        const penaltyResourceIds = penaltyCount > 0 ? extraResourceIds.slice(0, penaltyCount) : [];
        const extraCostResourceIds = extraCostSlots.length > 0 ? extraResourceIds.slice(penaltyCount) : [];

        if (hasOverlap(penaltyResourceIds, extraCostResourceIds)) return INVALID_MOVE;

        if (penaltyCount > 0) {
            const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
            const supply = G.zones[supplyId];
            for (const rid of penaltyResourceIds) {
                if (!supply?.items.includes(rid)) return INVALID_MOVE;
                if (G.objects[rid]?.owner !== pid || G.objects[rid]?.type !== 'Resource') return INVALID_MOVE;
            }
            G.engine.effectQueue.push({
                kind: 'resource.penaltyToNoise',
                playerId: pid,
                resourceIds: penaltyResourceIds
            });
        }

        if (extraCostSlots.length > 0) {
            if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.move', targetId, extraCostResourceIds, { includePingPongPenalty: false })) {
                return INVALID_MOVE;
            }
        }

        G.engine.effectQueue.push({
            kind: 'influence.move',
            playerId: pid,
            sourceTileId: sourceId,
            targetTileId: targetId
        });

        if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

        // CORE-01-04-12A: Only place Meta-Marker when source is ResortTile; set mode = PingPong
        if (marker && sourceTile?.type === TileType.Resort) {
            placeMetaMarkerOnTile(G, marker, sourceId, 'PingPong');
        } else if (marker) {
            returnMetaMarkerToSupply(G, pid);
        }

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },

    // CORE-01-04-13–19: FormalizeInfluence via Committee
    formalizeInfluence: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('formalizeInfluence', formalizeInfluencePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { committeeTileId, paymentResourceIds, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'formalizeInfluence')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;
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

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
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

        // CORE-01-04-09A: FormalizeInfluence does not place Meta-Marker â†’ return to supply
        returnMetaMarkerToSupply(G, pid);

        // Track usage (Generalized)
        if (isStartCommittee) {
            EffectResolver.incrementUsage(G, 'startCommittee', pid);
        }

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },

    // CORE-01-04-20–22: ConvertResources via Grassroots tile
    convertResources: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('convertResources', convertResourcesPayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { grassrootsTileId, inputResourceIds, outputResort, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'convertResources')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;
        const tile = G.tiles[grassrootsTileId];

        if (!tile || tile.type !== TileType.Grassroots) return INVALID_MOVE;
        if (!isBoardTile(G, grassrootsTileId)) return INVALID_MOVE;

        if (hasDuplicateIds(inputResourceIds)) return INVALID_MOVE;
        if (hasOverlap(inputResourceIds, extraResourceIds)) return INVALID_MOVE;
        if (!isCoreResort(outputResort)) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'convertResources', pid, grassrootsTileId)) return INVALID_MOVE;

        // CORE-01-04-22K/22L/22L.1: Validate recipe variant and output (Typed Variant B: output â‰  T)
        const conversionSpec = getGrassrootsConversionSpec(tile, inputResourceIds.length, outputResort);
        if (!conversionSpec) return INVALID_MOVE;

        const { controller } = computeMajority(grassrootsTileId, G);
        if (controller !== pid) return INVALID_MOVE;

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of inputResourceIds) {
            if (!supply.items.includes(rid)) return INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
        }

        if (inputResourceIds.length !== conversionSpec.inputSlots) return INVALID_MOVE;

        const baseCostValidation = EffectResolver.validateCost(G, ctx, {
            playerId: pid,
            slots: Array.from({ length: conversionSpec.inputSlots }, () => 'ANY'),
            resourceIds: inputResourceIds
        });
        if (!baseCostValidation.ok) return INVALID_MOVE;

        const extraCostSlots = EffectResolver.getExtraCostSlots(G, pid, 'convertResources', grassrootsTileId);
        if (extraCostSlots.length > 0 && (!extraResourceIds || extraResourceIds.length !== extraCostSlots.length)) {
            return INVALID_MOVE;
        }

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'convertResources', grassrootsTileId, extraResourceIds)) return INVALID_MOVE;

        // Emit conversion atoms
        G.engine.effectQueue.push(
            { kind: 'resource.pay', playerId: pid, amount: inputResourceIds.length, resorts: 'ANY', resourceIds: inputResourceIds }, // Logic for ANY handled by resolver
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

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },
};
