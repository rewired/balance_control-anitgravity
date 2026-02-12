import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, TileType, PlayerID } from '@balance-control/rules';
import { stringToCoord, coordToString, getNeighbors, isSurrounded } from './topology';
import { drawMeasure, allStartingInfluencePlaced, countPlayerInfluence, getInfluenceCap } from './mechanics-turn';
import { EffectResolver } from './engine/resolver';
import {
    resolveChoicePayloadSchema,
    placeInfluencePayloadSchema,
    moveInfluencePayloadSchema,
    formalizeInfluencePayloadSchema,
    convertResourcesPayloadSchema,
    placeTilePayloadSchema,
    passPayloadSchema,
    validateMovePayload
} from './move-contracts';

const DRAW_AND_PLACE_STAGE = 'drawAndPlace';
const POLITICAL_ACTION_STAGE = 'politicalAction';

function getCurrentStage(ctx: any): string | undefined {
    return ctx?.activePlayers?.[ctx?.currentPlayer];
}

function requireStage(ctx: any, expectedStage: string, moveName: string): boolean {
    const stage = getCurrentStage(ctx);
    if (stage === expectedStage) return true;

    console.error(`[move:${moveName}] illegal in stage "${stage ?? 'none'}"; expected "${expectedStage}".`);
    return false;
}

export const CoreMoves = {
    // SYSTEM: Multi-stage Choice Resolution
    resolveChoice: ({ G, ctx }: any, payload: unknown) => {
        const validated = validateMovePayload('resolveChoice', resolveChoicePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { choiceId, selection } = validated.value;

        if (!G.engine.pendingChoice || G.engine.pendingChoice.choiceId !== choiceId) return INVALID_MOVE;

        const choice = G.engine.pendingChoice;
        G.engine.pendingChoice = undefined;

        // Push resolution atom to front of queue
        G.engine.effectQueue.unshift({
            kind: 'choice.apply',
            choiceId,
            selection,
            context: choice.spec // Spec might contain the branching data
        } as any);

        EffectResolver.resolve(G, ctx);
    },

    // CORE-01-04-10–12: PlaceInfluence via Lobbyist
    placeInfluence: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('placeInfluence', placeInfluencePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { targetTileId, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'placeInfluence')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;

        const tile = G.tiles[targetTileId];

        if (!tile || tile.type !== TileType.Lobbyist) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'influence.place', pid, targetTileId)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.place', targetTileId, extraResourceIds)) return INVALID_MOVE;

        // CORE-01-08-01: Cannot exceed influence cap
        if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx)) return INVALID_MOVE;

        G.engine.effectQueue.push({
            kind: 'influence.place',
            playerId: pid,
            targetTileId
        });

        EffectResolver.resolve(G, ctx);

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },

    // CORE-01-04-12: Move exactly one Influence from one Board Tile to another
    moveInfluence: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('moveInfluence', moveInfluencePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { sourceId, targetId, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'moveInfluence')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;

        const srcZone = G.zones[sourceId];
        if (!srcZone) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'influence.move', pid, targetId)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.move', targetId, extraResourceIds)) return INVALID_MOVE;

        // CORE-01-04-12: Source must be a Board tile
        const boardZone = G.zones[CoreZoneNames.Board];
        if (!boardZone || !boardZone.items.includes(sourceId)) return INVALID_MOVE;

        // CORE-01-08-04: No Influence may be placed on the Start Committee
        const targetTile = G.tiles[targetId];
        if (targetTile && targetTile.type === TileType.StartCommittee) return INVALID_MOVE;

        const hasInf = srcZone.items.some((id: string) => G.objects[id]?.owner === pid && G.objects[id].type === 'Influence');
        if (!hasInf) return INVALID_MOVE;

        if (!G.zones[targetId]) return INVALID_MOVE;

        G.engine.effectQueue.push({
            kind: 'influence.move',
            playerId: pid,
            sourceTileId: sourceId,
            targetTileId: targetId
        });

        EffectResolver.resolve(G, ctx);

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

        if (!tile || (tile.type !== TileType.Committee && tile.type !== TileType.StartCommittee)) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'influence.formalize', pid, committeeTileId)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.formalize', committeeTileId, extraResourceIds)) return INVALID_MOVE;

        // CORE-01-08-02/03: Must place all starting influence first
        if (!allStartingInfluencePlaced(G, ctx)) return INVALID_MOVE;

        // CORE-01-08-01: Cannot exceed influence cap
        if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx)) return INVALID_MOVE;

        // CORE-01-08-07: Start Committee at most once per game per player (Generalized)
        if (tile.type === TileType.StartCommittee) {
            if (!EffectResolver.checkUsageLimit(G, 'startCommittee', pid)) return INVALID_MOVE;
        }

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of paymentResourceIds) {
            if (!supply.items.includes(rid)) return INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
        }

        const resources = paymentResourceIds.map((rid: string) => G.objects[rid]);
        const resorts = resources.map((r: any) => r.resort);

        // PUSH ATOMS
        G.engine.effectQueue.push({
            kind: 'resource.pay',
            playerId: pid,
            amount: paymentResourceIds.length,
            resorts: Array.from(new Set(resorts)) as string[]
        });

        G.engine.effectQueue.push({
            kind: 'influence.formalize',
            playerId: pid,
            tileId: committeeTileId,
            resourceIds: paymentResourceIds
        });

        EffectResolver.resolve(G, ctx);

        // Track usage (Generalized)
        if (tile.type === TileType.StartCommittee) {
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
        const { grassrootsTileId, inputResourceIds, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'convertResources')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;
        const tile = G.tiles[grassrootsTileId];

        if (!tile || tile.type !== TileType.Grassroots) return INVALID_MOVE;

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, 'convertResources', pid, grassrootsTileId)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'convertResources', grassrootsTileId, extraResourceIds)) return INVALID_MOVE;

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of inputResourceIds) {
            if (!supply.items.includes(rid)) return INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
        }

        // Emit conversion atoms
        G.engine.effectQueue.push(
            { kind: 'resource.pay', playerId: pid, amount: inputResourceIds.length, resorts: 'ANY' }, // Logic for ANY handled by resolver
            { kind: 'influence.formalize', playerId: pid, resourceIds: [], context: { source: 'convert', grassrootsTileId } }
        );
        EffectResolver.resolve(G, ctx);

        // Usage tracking
        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    },

    // CORE-01-04-02: DrawAndPlaceTile — place drawn tile at coord
    placeTile: ({ G, ctx, events }: any, payload: unknown) => {
        const validated = validateMovePayload('placeTile', placeTilePayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const { targetCoord, extraResourceIds } = validated.value;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, DRAW_AND_PLACE_STAGE, 'placeTile')) return INVALID_MOVE;
        const stagingId = `staging_${pid}`;
        const staging = G.zones[stagingId];

        if (!staging || staging.items.length === 0) return INVALID_MOVE;

        const tileId = staging.items[0];
        const tile = G.tiles[tileId];

        // Generalized Action Type for cost check
        const actionType = tile && tile.type === TileType.Resort ? 'placeResort' : 'placeTile';

        // Generic Prohibition check
        if (EffectResolver.isProhibited(G, actionType, pid)) return INVALID_MOVE;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, actionType, undefined, extraResourceIds)) return INVALID_MOVE;

        if (G.grid[targetCoord]) return INVALID_MOVE; // Occupied

        const coord = stringToCoord(targetCoord);
        const neighbors = getNeighbors(coord);

        // CORE-01-04-05: Must be adjacent to at least one Board tile
        const hasNeighbor = neighbors.some(n => G.grid[coordToString(n)] !== undefined);
        if (!hasNeighbor) {
            if (Object.keys(G.grid).length > 0) return INVALID_MOVE;
        }

        const boardZone = G.zones[CoreZoneNames.Board];

        staging.items.shift();
        boardZone.items.push(tileId);

        G.grid[targetCoord] = tileId;

        if (!G.adjacency[tileId]) G.adjacency[tileId] = [];

        neighbors.forEach(n => {
            const nStr = coordToString(n);
            const nId = G.grid[nStr];
            if (nId) {
                G.adjacency[tileId].push(nId);
                if (!G.adjacency[nId]) G.adjacency[nId] = [];
                G.adjacency[nId].push(tileId);
            }
        });

        // CORE-01-06-02/03: Hotspot check — skip StartCommittee (CORE-01-08-06)
        const candidates = [coord, ...neighbors];
        candidates.forEach(c => {
            const tId = G.grid[coordToString(c)];
            if (!tId) return;
            const candidateTile = G.tiles[tId];
            if (candidateTile && candidateTile.type === TileType.StartCommittee) return;
            if (isSurrounded(c, G.grid)) {
                G.engine.effectQueue.push({ kind: 'hotspot.resolve', tileId: tId });
            }
        });
        EffectResolver.resolve(G, ctx);

        // End Stage → politicalAction
        if (events && events.endStage) {
            events.endStage();
        } else if (events && events.setStage) {
            events.setStage('politicalAction');
        }
    },

    // Pass = choose no political action, just end turn
    pass: ({ G, ctx, events }: any, payload?: unknown) => {
        const validated = validateMovePayload('pass', passPayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;
        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, POLITICAL_ACTION_STAGE, 'pass')) return INVALID_MOVE;
        if (!EffectResolver.checkUsageLimit(G, 'politicalAction', pid)) return INVALID_MOVE;

        EffectResolver.incrementUsage(G, 'politicalAction', pid);
        events.endTurn();
    }
};
