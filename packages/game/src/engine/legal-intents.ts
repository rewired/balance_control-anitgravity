import { CoreZoneName, GameState, TileType } from '@balance-control/rules';
import { allStartingInfluencePlaced, countPlayerInfluence, getInfluenceCap, hasInfluenceInSupply } from '../mechanics-turn';
import { computeMajority } from '../mechanics';
import { coordToString, getNeighbors, stringToCoord } from '../topology';
import { isMoveAdjacent } from './topology';
import { EffectResolver } from './resolver';
import { evaluateTileSelector } from './selectors';
import { EnginePackRegistry } from '../expansion-registry';
import { getPlayerMetaMarker } from '../state-lookup';

type CostSlot = string[] | 'ANY';
type JsonLike =
    | null
    | boolean
    | number
    | string
    | JsonLike[]
    | { [key: string]: JsonLike | undefined };

function canonicalize(value: JsonLike): JsonLike {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => canonicalize(entry as JsonLike));
    }

    const input = value as { [key: string]: JsonLike | undefined };
    const ordered: { [key: string]: JsonLike } = {};
    const keys = Object.keys(input).sort();

    for (const key of keys) {
        const entry = input[key];
        if (entry !== undefined) {
            ordered[key] = canonicalize(entry);
        }
    }

    return ordered;
}

function canonicalJsonStringify(value: JsonLike): string {
    return JSON.stringify(canonicalize(value));
}

export interface LegalIntent {
    moveType: string;
    payload: any;
    contextTileId?: string;
    description?: string;
    consequences?: string[];
}

/**
 * Enumerates all legal moves for a player in the current state.
 * @rule CORE-01-04-05A
 * @rule CORE-01-04-09
 * @deterministic
 * @pure
 */
export function enumerateLegalIntents(G: GameState, ctx: any, playerID: string): LegalIntent[] {
    if (!playerID) return [];
    if (ctx.currentPlayer !== playerID) return [];
    const pendingChoice = G.engine?.pendingChoice;
    if (pendingChoice) {
        if (pendingChoice.player !== playerID) return [];
        const intents = buildResolveChoiceIntents(G, ctx, pendingChoice);
        return sortIntents(intents);
    }

    const stage = ctx.activePlayers?.[playerID] ?? inferStageBestEffort(G, playerID);
    const intents: LegalIntent[] = [];

    if (stage === 'drawAndPlace') {
        const stagingId = `staging_${playerID}`;
        const staging = G.zones[stagingId];
        const stagedTileId = staging?.items?.[0];
        if (stagedTileId) {
            const stagedTile = G.tiles[stagedTileId];
            const actionType = stagedTile?.type === TileType.Resort ? 'placeResort' : 'placeTile';
            if (!EffectResolver.isProhibited(G as any, actionType, playerID)) {
                const costSlots = EffectResolver.getExtraCostSlots(G as any, playerID, actionType);
                const canPay = canPayExtraCosts(G, playerID, costSlots);
                if (canPay) {
                    const ghostCoords = getGhostCoords(G);
                    for (const coord of ghostCoords) {
                        intents.push({
                            moveType: 'placeTile',
                            payload: { targetCoord: coord },
                            contextTileId: stagedTileId
                        });
                    }
                }
            }
        } else {
            intents.push({ moveType: 'passTilePlacement', payload: {} });
        }
    }

    if (stage === 'politicalAction') {
        if (EffectResolver.checkUsageLimit(G as any, 'politicalAction', playerID)) {
            intents.push(...enumeratePlaceInfluence(G, playerID));
            intents.push(...enumerateMoveInfluence(G, playerID));
            intents.push(...enumerateFormalize(G, ctx, playerID));
            intents.push(...enumerateConvertResources(G, playerID));
            intents.push(...enumerateTakeMeasure(G, playerID));
        }
    }

    return sortIntents(intents).slice(0, LEGAL_INTENT_BUDGET);
}

const LEGAL_INTENT_BUDGET = 2000;

function selectDeterministicExtraResourceIds(G: GameState, playerId: string, costSlots: CostSlot[]): string[] | null {
    if (costSlots.length === 0) return [];

    // validateCost will deterministically pick resources from supply if resourceIds is undefined
    const validation = EffectResolver.validateCost(G as any, null, {
        playerId,
        slots: costSlots,
        resourceIds: undefined // Explicitly undefined to trigger auto-selection
    });

    if (validation.ok) {
        return validation.resourceIds;
    }
    return null;
}

function buildResolveChoiceIntents(G: GameState, ctx: any, pendingChoice: any): LegalIntent[] {
    const selections = getChoiceSelections(G, ctx, pendingChoice);
    return selections.map(selection => ({
        moveType: 'resolveChoice',
        payload: { choiceId: pendingChoice.choiceId, selection }
    }));
}

function inferStageBestEffort(G: GameState, playerID: string): string {
    const stagingId = `staging_${playerID}`;
    const stagedTileId = G.zones[stagingId]?.items?.[0];
    if (stagedTileId) return 'drawAndPlace';
    if (G.engine?.attributes?.drawPileEmptyAtTurnStart) return 'drawAndPlace';
    return 'politicalAction';
}

function getChoiceSelections(G: GameState, ctx: any, pendingChoice: any): any[] {
    const kind = pendingChoice.kind;
    const spec = pendingChoice.spec || {};

    if (kind === 'yesNo') return [true, false];

    if (kind === 'selectOption') {
        const options = Array.isArray(spec.options) ? spec.options : [];
        return [...options].sort((a: any, b: any) => String(a).localeCompare(String(b)));
    }

    if (kind === 'selectTile') {
        if (Array.isArray(spec.tileIds)) {
            return [...spec.tileIds].sort((a: string, b: string) => a.localeCompare(b));
        }
        if (spec.selector) {
            return Object.keys(G.tiles)
                .filter(tileId => evaluateTileSelector(spec.selector, tileId, G))
                .sort((a, b) => a.localeCompare(b));
        }
    }

    if (kind === 'selectResource') {
        if (Array.isArray(spec.resourceIds)) {
            return [...spec.resourceIds].sort((a: string, b: string) => a.localeCompare(b));
        }
        const playerId = spec.playerId ?? pendingChoice.player;
        return getPlayerResourceIds(G, playerId);
    }

    if (kind === 'selectPlayer') {
        if (Array.isArray(spec.playerIds)) {
            return [...spec.playerIds].sort((a: string, b: string) => a.localeCompare(b));
        }
        const players = [];
        for (let i = 0; i < ctx.numPlayers; i++) players.push(i.toString());
        return players;
    }

    return [];
}

function enumeratePlaceInfluence(G: GameState, playerID: string): LegalIntent[] {
    const intents: LegalIntent[] = [];
    if (!hasInfluenceInSupply(G, playerID)) return intents;

    const boardTiles = getBoardTileIds(G);

    for (const tileId of boardTiles) {
        if (tileId === 'tile_start_committee') continue;
        if (EffectResolver.isProhibited(G as any, 'influence.place', playerID, tileId)) continue;
        const costSlots = EffectResolver.getExtraCostSlots(G as any, playerID, 'influence.place', tileId);
        if (!canPayExtraCosts(G, playerID, costSlots)) continue;
        intents.push({
            moveType: 'placeInfluence',
            payload: { targetTileId: tileId },
            contextTileId: tileId
        });
    }

    return intents;
}

function enumerateMoveInfluence(G: GameState, playerID: string): LegalIntent[] {
    const intents: LegalIntent[] = [];
    const boardTiles = getBoardTileIds(G);
    const sources = boardTiles.filter(tileId => {
        const tile = G.tiles[tileId];
        if (tile && tile.type === TileType.StartCommittee) return false;
        return hasPlayerInfluenceOnTile(G, tileId, playerID);
    });

    for (const sourceId of sources) {
        for (const targetId of boardTiles) {
            if (sourceId === targetId) continue;

            // CORE-01-04-12D / CORE-01-08-06E
            if (!isMoveAdjacent(G, sourceId, targetId)) continue;

            if (EffectResolver.isProhibited(G as any, 'influence.move', playerID, targetId)) continue;

            // Calculate costs including any penalties
            const costSlots = EffectResolver.getExtraCostSlots(G as any, playerID, 'influence.move', targetId, { includeReturnPenalty: true });

            // Try to select deterministic payment
            const extraResourceIds = selectDeterministicExtraResourceIds(G, playerID, costSlots);

            // If we can't pay (or selector returned null), specific move is illegal
            if (!extraResourceIds) continue;

            const consequences: string[] = [];
            const marker = getPlayerMetaMarker(G, playerID);

            // CORE-01-04-12B: Return Penalty
            // Only applicable to MoveInfluence, not PlaceInfluence
            if (marker && marker.tileId === targetId && marker.mode === 'ReturnPenalty') {
                consequences.push('Return Penalty applies');
            }

            // CORE-01-04-12A: Enter Return Penalty Mode
            const sourceTile = G.tiles[sourceId];
            if (marker && sourceTile?.type === TileType.Resort) {
                consequences.push('Enter Return Penalty Mode');
            }

            intents.push({
                moveType: 'moveInfluence',
                payload: {
                    sourceId,
                    targetId,
                    extraResourceIds: extraResourceIds.length > 0 ? extraResourceIds : undefined
                },
                contextTileId: targetId,
                consequences: consequences.length > 0 ? consequences : undefined
            });
        }
    }

    return intents;
}

function enumerateFormalize(G: GameState, ctx: any, playerID: string): LegalIntent[] {
    const intents: LegalIntent[] = [];
    const boardTiles = getBoardTileIds(G);
    const supplyResources = getPlayerResourceIds(G, playerID);

    for (const tileId of boardTiles) {
        const tile = G.tiles[tileId];
        if (!tile) continue;
        if (tile.type !== TileType.Committee && tile.type !== TileType.StartCommittee) continue;
        if (countPlayerInfluence(G, playerID) >= getInfluenceCap(ctx)) continue;
        const isStartCommittee = tile.type === TileType.StartCommittee;

        if (isStartCommittee) {
            if (!allStartingInfluencePlaced(G, ctx)) continue;
            if (!EffectResolver.checkUsageLimit(G as any, 'startCommittee', playerID)) continue;
        } else {
            if (EffectResolver.isProhibited(G as any, 'influence.formalize', playerID, tileId)) continue;
        }

        const requiredCount = isStartCommittee ? 4 : 2;
        const paymentCandidates = enumerateResourceCombos(G, supplyResources, requiredCount)
            .filter(combo => hasUniqueResorts(G, combo, isStartCommittee ? 3 : 2));

        for (const paymentResourceIds of paymentCandidates) {
            const extraCostSlots = isStartCommittee ? [] : EffectResolver.getExtraCostSlots(G as any, playerID, 'influence.formalize', tileId);
            const extraResourceCombos = extraCostSlots.length === 0
                ? [[]]
                : enumerateCostResourceIds(G, playerID, extraCostSlots, new Set(paymentResourceIds));
            for (const extraResourceIds of extraResourceCombos) {
                intents.push({
                    moveType: 'formalizeInfluence',
                    payload: {
                        committeeTileId: tileId,
                        paymentResourceIds,
                        extraResourceIds: extraResourceIds.length > 0 ? extraResourceIds : undefined
                    },
                    contextTileId: tileId
                });
            }
        }
    }

    return intents;
}

function enumerateConvertResources(G: GameState, playerID: string): LegalIntent[] {
    const intents: LegalIntent[] = [];
    const boardTiles = getBoardTileIds(G);
    const supplyResources = getPlayerResourceIds(G, playerID);
    const coreResorts = ['DOM', 'FOR', 'INF'];

    for (const tileId of boardTiles) {
        const tile = G.tiles[tileId];
        if (!tile || tile.type !== TileType.Grassroots) continue;
        if (EffectResolver.isProhibited(G as any, 'convertResources', playerID, tileId)) continue;
        const conversionSpec = tile.conversion;
        if (!conversionSpec || conversionSpec.inputSlots <= 0) continue;
        const { controller } = computeMajority(tileId, G);
        if (controller !== playerID) continue;

        const inputCombos = enumerateResourceCombos(G, supplyResources, conversionSpec.inputSlots);
        const extraCostSlots = EffectResolver.getExtraCostSlots(G as any, playerID, 'convertResources', tileId);

        for (const inputResourceIds of inputCombos) {
            const extraResourceCombos = extraCostSlots.length === 0
                ? [[]]
                : enumerateCostResourceIds(G, playerID, extraCostSlots, new Set(inputResourceIds));
            if (extraResourceCombos.length === 0) continue;
            for (const outputResort of coreResorts) {
                for (const extraResourceIds of extraResourceCombos) {
                    intents.push({
                        moveType: 'convertResources',
                        payload: {
                            grassrootsTileId: tileId,
                            inputResourceIds,
                            outputResort,
                            extraResourceIds: extraResourceIds.length > 0 ? extraResourceIds : undefined
                        },
                        contextTileId: tileId
                    });
                }
            }
        }
    }

    return intents;
}

function enumerateTakeMeasure(G: GameState, playerID: string): LegalIntent[] {
    const intents: LegalIntent[] = [];
    if (EffectResolver.isProhibited(G as any, 'measure.take', playerID)) return intents;
    if (!EffectResolver.checkUsageLimit(G as any, 'measure.hold', playerID)) return intents;

    const decks = EnginePackRegistry.getMeasureDeckDescriptors(G);
    for (const entry of decks) {
        const openZoneId = entry.deck.zones.openZoneId;
        const openZone = G.zones[openZoneId];
        if (!openZone || openZone.items.length === 0) continue;
        for (const measureObjectId of openZone.items) {
            intents.push({
                moveType: `${entry.expansionId}.takeMeasure`,
                payload: measureObjectId
            });
        }
    }

    return intents;
}

function getBoardTileIds(G: GameState): string[] {
    const board = G.zones[CoreZoneName.Board];
    if (!board) return [];
    return [...board.items].sort((a, b) => a.localeCompare(b));
}

function getGhostCoords(G: GameState): string[] {
    const occupiedCoords = Object.keys(G.grid || {}).sort((a, b) => a.localeCompare(b));
    if (occupiedCoords.length === 0) return ['0,0'];
    const occupied = new Set(occupiedCoords);
    const ghosts = new Set<string>();

    for (const coordStr of occupiedCoords) {
        const coord = stringToCoord(coordStr);
        for (const neighbor of getNeighbors(coord)) {
            const nStr = coordToString(neighbor);
            if (!occupied.has(nStr)) ghosts.add(nStr);
        }
    }

    return Array.from(ghosts).sort((a, b) => a.localeCompare(b));
}

function getPlayerResourceIds(G: GameState, playerID: string): string[] {
    const supplyId = `${CoreZoneName.PersonalSupply}:${playerID}`;
    const supply = G.zones[supplyId];
    if (!supply) return [];
    return supply.items
        .filter(itemId => {
            const obj = G.objects[itemId];
            return obj && obj.type === 'Resource';
        })
        .sort((a, b) => a.localeCompare(b));
}

function hasPlayerInfluenceOnTile(G: GameState, tileId: string, playerID: string): boolean {
    const zone = G.zones[tileId];
    if (!zone) return false;
    return zone.items.some(itemId => {
        const obj: any = G.objects[itemId];
        return obj && obj.type === 'Influence' && obj.owner === playerID;
    });
}

function enumerateResourceCombos(G: GameState, resourceIds: string[], count: number): string[][] {
    const results: string[][] = [];
    if (count <= 0) return results;
    const sorted = [...resourceIds].sort((a, b) => a.localeCompare(b));

    const recurse = (startIndex: number, acc: string[]) => {
        if (acc.length === count) {
            results.push([...acc]);
            return;
        }
        for (let i = startIndex; i <= sorted.length - (count - acc.length); i++) {
            const rid = sorted[i];
            if (!isResourceId(G, rid)) continue;
            acc.push(rid);
            recurse(i + 1, acc);
            acc.pop();
        }
    };

    recurse(0, []);
    return results;
}

function hasUniqueResorts(G: GameState, resourceIds: string[], requiredUnique: number): boolean {
    const resorts = new Set<string>();
    for (const rid of resourceIds) {
        const res: any = G.objects[rid];
        if (res && res.resort) resorts.add(res.resort);
    }
    return resorts.size >= requiredUnique;
}

function enumerateCostResourceIds(G: GameState, playerID: string, slots: CostSlot[], excluded: Set<string>): string[][] {
    if (slots.length === 0) return [[]];
    const available = getPlayerResourceIds(G, playerID).filter(rid => !excluded.has(rid));
    const results: string[][] = [];
    const normalizedSlots = slots.map(slot => normalizeSlot(slot));

    const recurse = (slotIndex: number, acc: string[], used: Set<string>, lastAnyIndex: number) => {
        if (slotIndex >= normalizedSlots.length) {
            results.push([...acc]);
            return;
        }

        const slot = normalizedSlots[slotIndex];
        const isAny = slot === 'ANY';
        const minIndex = isAny && slotIndex > 0 && normalizedSlots[slotIndex - 1] === 'ANY' ? lastAnyIndex + 1 : 0;

        for (let i = minIndex; i < available.length; i++) {
            const rid = available[i];
            if (used.has(rid)) continue;
            if (!isResourceId(G, rid)) continue;
            if (!canUseResource(G, rid, slot)) continue;
            used.add(rid);
            acc.push(rid);
            recurse(slotIndex + 1, acc, used, isAny ? i : lastAnyIndex);
            acc.pop();
            used.delete(rid);
        }
    };

    recurse(0, [], new Set<string>(), -1);
    return results;
}

function normalizeSlot(slot: CostSlot): CostSlot {
    if (slot === 'ANY') return 'ANY';
    if (slot.includes('ANY')) return 'ANY';
    return slot;
}

function canUseResource(G: GameState, resourceId: string, slot: CostSlot): boolean {
    if (slot === 'ANY') return true;
    const res: any = G.objects[resourceId];
    if (!res) return false;
    return slot.includes(res.resort);
}

function isResourceId(G: GameState, resourceId: string): boolean {
    const res: any = G.objects[resourceId];
    return Boolean(res && res.type === 'Resource');
}

function canPayExtraCosts(G: GameState, playerID: string, costSlots: CostSlot[]): boolean {
    if (costSlots.length === 0) return true;
    const validation = EffectResolver.validateCost(G as any, null, {
        playerId: playerID,
        slots: costSlots,
        resourceIds: undefined
    });
    return validation.ok;
}

function sortIntents(intents: LegalIntent[]): LegalIntent[] {
    return [...intents].sort((a, b) => {
        const typeCmp = a.moveType.localeCompare(b.moveType);
        if (typeCmp !== 0) return typeCmp;
        const aPayload = canonicalJsonStringify(a.payload ?? {});
        const bPayload = canonicalJsonStringify(b.payload ?? {});
        return aPayload.localeCompare(bPayload);
    });
}
