import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { isMoveAdjacent } from '../../../engine/topology';
import { EffectResolver } from '../../../engine/resolver';
import {
    resolveProvidedOrDeterministicResourceIds,
    splitCombinedResourceIds,
    validateDistinctCostBuckets,
} from '../../../engine/cost-bucket-utils';
import { findObjectZoneId, getPlayerMetaMarker } from '../../../state-lookup';
import { moveInfluencePayloadSchema, validateMovePayload } from '../../../move-contracts';
import { isBoardTile, placeMetaMarkerOnTile } from '../../shared';
import { returnMetaMarkerToSupply } from '../../../mechanics-turn';
import { beginPoliticalActionMove, finalizePoliticalActionMove } from './shared';

/**
 * Moves exactly one influence from one board tile to another.
 * @rule CORE-01-04-12
 * @rule CORE-01-04-12A
 * @rule CORE-01-04-12B
 * @rule CORE-01-04-12D
 * @rule CORE-01-08-06E
 * @rule CORE-01-02-17D
 * @deterministic
 * @sideEffects
 */
export const moveInfluence = ({ G, ctx, events }: any, payload: unknown) => {
    const validated = validateMovePayload('moveInfluence', moveInfluencePayloadSchema, payload);
    if (!validated.ok) return INVALID_MOVE;
    const { sourceId, targetId, extraResourceIds } = validated.value;

    const pid = beginPoliticalActionMove({ G, ctx }, 'moveInfluence');
    if (pid === INVALID_MOVE) return INVALID_MOVE;

    // Generic Prohibition check
    if (EffectResolver.isProhibited(G, 'influence.move', pid, targetId)) return INVALID_MOVE;

    if (!isBoardTile(G, sourceId) || !isBoardTile(G, targetId)) return INVALID_MOVE;

    // CORE-01-04-12D / CORE-01-08-06E
    if (!isMoveAdjacent(G, sourceId, targetId)) return INVALID_MOVE;

    const srcZone = G.zones[sourceId];
    if (!srcZone) return INVALID_MOVE;

    const sourceTile = G.tiles[sourceId];

    const hasInf = srcZone.items.some((id: string) => G.objects[id]?.owner === pid && G.objects[id].type === 'Influence');
    if (!hasInf) return INVALID_MOVE;

    if (!G.zones[targetId]) return INVALID_MOVE;

    // CORE-01-04-12B
    const marker = getPlayerMetaMarker(G, pid);
    const markerZoneId = marker ? findObjectZoneId(G, marker.id) : null;
    let penaltyCount = 0;
    if (marker && marker.mode === 'ReturnPenalty' && markerZoneId === targetId) {
        const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        const R = supply?.items?.filter((id: string) => G.objects[id]?.type === 'Resource').length ?? 0;
        penaltyCount = Math.min(10, Math.floor(R / 2));
    }

    const extraCostSlots = EffectResolver.getExtraCostSlots(G, pid, 'influence.move', targetId, { includeReturnPenalty: false });
    const providedBuckets = splitCombinedResourceIds(extraResourceIds, [penaltyCount, extraCostSlots.length]);
    if (!providedBuckets) return INVALID_MOVE;

    const [providedPenaltyIds, providedExtraCostIds] = providedBuckets;
    const penaltyResourceIds = resolveProvidedOrDeterministicResourceIds(
        G,
        pid,
        Array.from({ length: penaltyCount }, () => 'ANY'),
        providedPenaltyIds
    );
    if (!penaltyResourceIds) return INVALID_MOVE;

    const extraCostResourceIds = resolveProvidedOrDeterministicResourceIds(
        G,
        pid,
        extraCostSlots,
        providedExtraCostIds,
        new Set(penaltyResourceIds)
    );
    if (!extraCostResourceIds) return INVALID_MOVE;

    if (!validateDistinctCostBuckets([penaltyResourceIds, extraCostResourceIds])) return INVALID_MOVE;

    if (penaltyCount > 0) {
        const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
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
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.move', targetId, extraCostResourceIds, { includeReturnPenalty: false })) {
            return INVALID_MOVE;
        }
    }

    const historyBefore = G.engine.history.length;

    G.engine.effectQueue.push({
        kind: 'influence.move',
        playerId: pid,
        sourceTileId: sourceId,
        targetTileId: targetId
    });

    if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

    const handledInfluenceMove = G.engine.history
        .slice(historyBefore)
        .some((entry: { atom?: string }) => entry.atom === 'influence.move');
    if (!handledInfluenceMove) return INVALID_MOVE;

    // CORE-01-04-12A: Only place Meta-Marker when source is ResortTile; set mode = ReturnPenalty
    if (marker && sourceTile?.type === TileType.Resort) {
        placeMetaMarkerOnTile(G, marker, sourceId, 'ReturnPenalty');
    } else if (marker) {
        returnMetaMarkerToSupply(G, pid);
    }

    finalizePoliticalActionMove({ G, events }, pid);
};
