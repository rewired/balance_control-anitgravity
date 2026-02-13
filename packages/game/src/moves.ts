import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, CoreResources, TileType, PlayerID } from '@balance-control/rules';
import { stringToCoord, coordToString, getNeighbors, isSurrounded } from './topology';
import { drawMeasure, allStartingInfluencePlaced, countPlayerInfluence, getInfluenceCap } from './mechanics-turn';
import { computeMajority } from './mechanics';
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

function hasDuplicateIds(ids: string[]): boolean {
    return new Set(ids).size !== ids.length;
}

function hasOverlap(a: string[], b?: string[]): boolean {
    if (!b || b.length === 0) return false;
    const set = new Set(a);
    return b.some(id => set.has(id));
}

type CostSlot = string[] | 'ANY';

interface GrassrootsConversionSpec {
    inputSlots: number;
    outputSlots: number;
}

function isBoardTile(G: any, tileId: string): boolean {
    const boardZone = G.zones[CoreZoneNames.Board];
    return Boolean(boardZone?.items?.includes(tileId));
}

function getGrassrootsConversionSpec(tile: any): GrassrootsConversionSpec | null {
    const spec = tile?.conversion;
    if (!spec || typeof spec.inputSlots !== 'number') {
        return null;
    }

    if (!Number.isInteger(spec.inputSlots) || spec.inputSlots <= 0) return null;
    const outputSlots = Number.isInteger(spec.outputSlots) && spec.outputSlots > 0 ? spec.outputSlots : 1;

    return {
        inputSlots: spec.inputSlots,
        outputSlots
    };
}

function isCoreResort(resort: string): boolean {
    return resort === CoreResources.DOM || resort === CoreResources.FOR || resort === CoreResources.INF;
}

function getPlayerMetaMarker(G: any, playerId: string): any | null {
    const directId = `meta_${playerId}`;
    const objects = (G.objects ?? {}) as Record<string, any>;
    const direct = objects[directId];
    if (direct && direct.type === 'MetaMarker') return direct;
    for (const obj of Object.values(objects)) {
        if (obj && obj.type === 'MetaMarker' && obj.owner === playerId) return obj;
    }
    return null;
}

function findObjectZoneId(G: any, objectId: string): string | null {
    const zones = (G.zones ?? {}) as Record<string, any>;
    for (const zone of Object.values(zones)) {
        if (zone.items.includes(objectId)) return zone.id;
    }
    return null;
}

function placeMetaMarkerOnTile(G: any, marker: any, tileId: string, mode: 'PingPong' | 'Shift' | 'Convert', expiresRound: number) {
    const currentZoneId = findObjectZoneId(G, marker.id);
    if (currentZoneId && currentZoneId !== tileId) {
        const currentZone = G.zones[currentZoneId];
        if (currentZone) {
            currentZone.items = currentZone.items.filter((id: string) => id !== marker.id);
        }
    }

    const targetZone = G.zones[tileId];
    if (targetZone && !targetZone.items.includes(marker.id)) {
        targetZone.items.push(marker.id);
    }

    marker.mode = mode;
    marker.expiresRound = expiresRound;
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
        const markerOnDestination = markerZoneId === targetId;

        // Decoupled Extra Costs
        if (!EffectResolver.checkAndPayCosts(G, pid, 'influence.move', targetId, extraResourceIds)) return INVALID_MOVE;

        G.engine.effectQueue.push({
            kind: 'influence.move',
            playerId: pid,
            sourceTileId: sourceId,
            targetTileId: targetId
        });

        if (!EffectResolver.resolve(G, ctx)) return INVALID_MOVE;

        if (marker) {
            // CORE-01-04-12A–12C
            const expiresRound = (G.roundNumber ?? 0) + 1;
            const mode = markerOnDestination ? 'PingPong' : 'Shift';
            placeMetaMarkerOnTile(G, marker, sourceId, mode, expiresRound);
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

        const conversionSpec = getGrassrootsConversionSpec(tile);
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
            const expiresRound = (G.roundNumber ?? 0) + 1;
            placeMetaMarkerOnTile(G, marker, grassrootsTileId, 'Convert', expiresRound);
        }

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

    // CORE-01-09-01 / CORE-01-07-02: Allow round completion when DrawPile is empty mid-round.
    passTilePlacement: ({ G, ctx, events }: any, payload?: unknown) => {
        const validated = validateMovePayload('passTilePlacement', passPayloadSchema, payload);
        if (!validated.ok) return INVALID_MOVE;

        const pid = ctx.currentPlayer;
        if (!requireStage(ctx, DRAW_AND_PLACE_STAGE, 'passTilePlacement')) return INVALID_MOVE;

        const stagingId = `staging_${pid}`;
        const staging = G.zones[stagingId];
        if (!staging || staging.items.length > 0) return INVALID_MOVE;

        if (events && events.endStage) {
            events.endStage();
        } else if (events && events.setStage) {
            events.setStage(POLITICAL_ACTION_STAGE);
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
