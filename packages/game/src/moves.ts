import { resolveEffect, resolveProduction, getRegulationModifiers } from './mechanics';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, TileType, PlayerID } from '@balance-control/rules';
import { stringToCoord, coordToString, getNeighbors, isSurrounded } from './topology';
import { drawMeasure, allStartingInfluencePlaced, countPlayerInfluence, getInfluenceCap } from './mechanics-turn';
import { EffectResolver } from './engine/resolver';

export const CoreMoves = {
    // SYSTEM: Multi-stage Choice Resolution
    resolveChoice: ({ G, ctx }: any, { choiceId, selection }: { choiceId: string, selection: any }) => {
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
    placeInfluence: ({ G, ctx, events }: any, { targetTileId, extraResourceIds, transferToPlayerId }: { targetTileId: string, extraResourceIds?: string[], transferToPlayerId?: string }) => {
        const pid = ctx.currentPlayer;
        const tile = G.tiles[targetTileId];

        if (!tile || tile.type !== TileType.Lobbyist) return INVALID_MOVE;

        // Handle Extra Costs (EXP-01/EXP-02/EXP-03)
        if (!handleExtraCosts(G, pid, extraResourceIds, targetTileId, 'PLACE_INFLUENCE', transferToPlayerId)) return INVALID_MOVE;

        // CORE-01-08-01: Cannot exceed influence cap
        if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx)) return INVALID_MOVE;

        G.engine.effectQueue.push({
            kind: 'influence.place',
            playerId: pid,
            targetTileId
        });

        EffectResolver.resolve(G, ctx);

        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },

    // CORE-01-04-12: Move exactly one Influence from one Board Tile to another
    moveInfluence: ({ G, ctx, events }: any, { sourceId, targetId, extraResourceIds, transferToPlayerId }: { sourceId: string, targetId: string, extraResourceIds?: string[], transferToPlayerId?: string }) => {
        const pid = ctx.currentPlayer;
        const srcZone = G.zones[sourceId];
        if (!srcZone) return INVALID_MOVE;

        // Handle Extra Costs (EXP-01/EXP-02/EXP-03)
        if (!handleExtraCosts(G, pid, extraResourceIds, targetId, 'MOVE_INFLUENCE', transferToPlayerId)) return INVALID_MOVE;

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

        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },

    // CORE-01-04-13–19: FormalizeInfluence via Committee
    formalizeInfluence: ({ G, ctx, events }: any, { committeeTileId, paymentResourceIds, extraResourceIds, transferToPlayerId, payForInfluenceResourceId }: { committeeTileId: string, paymentResourceIds: string[], extraResourceIds?: string[], transferToPlayerId?: string, payForInfluenceResourceId?: string }) => {

        const pid = ctx.currentPlayer;
        const tile = G.tiles[committeeTileId];

        if (!tile || (tile.type !== TileType.Committee && tile.type !== TileType.StartCommittee)) return INVALID_MOVE;

        // Handle Extra Costs (EXP-01/EXP-02/EXP-03)
        if (!handleExtraCosts(G, pid, extraResourceIds, committeeTileId, 'FORMALIZE', transferToPlayerId)) return INVALID_MOVE;

        // CORE-01-08-02/03: Must place all starting influence first
        if (!allStartingInfluencePlaced(G, ctx)) return INVALID_MOVE;

        // CORE-01-08-01: Cannot exceed influence cap
        if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx)) return INVALID_MOVE;

        // CORE-01-08-07: Start Committee at most once per game per player
        if (tile.type === TileType.StartCommittee) {
            if (G.startCommitteeUsed && G.startCommitteeUsed[pid]) return INVALID_MOVE;
        }

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of paymentResourceIds) {
            if (!supply.items.includes(rid)) return INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
        }

        const resources = paymentResourceIds.map((rid: string) => G.objects[rid]);
        const resorts = resources.map((r: any) => r.resort);

        // EXP-01-08-M08: Economic Council (Treat 1 non-ECO as ECO)
        const hasEcoPerk = G.secret?.playerPerks?.[pid]?.ecoSubstitute;
        if (hasEcoPerk) {
            const firstNonEcoIdx = resorts.findIndex((r: any) => r !== 'ECO');
            if (firstNonEcoIdx >= 0) {
                resorts[firstNonEcoIdx] = 'ECO';
                // Consumed
                G.secret.playerPerks[pid].ecoSubstitute = false;
            }
        }

        const uniqueResorts = new Set(resorts);

        if (tile.type === TileType.StartCommittee) {
            // CORE-01-08-08: 3 different resorts + 1 any = 4 total
            if (paymentResourceIds.length !== 4) return INVALID_MOVE;
            if (uniqueResorts.size < 3) return INVALID_MOVE;
        } else {
            // CORE-01-04-15: 2 Resources of different resorts
            if (paymentResourceIds.length !== 2) return INVALID_MOVE;
            if (uniqueResorts.size < 2) return INVALID_MOVE;
        }

        // PUSH ATOMS
        G.engine.effectQueue.push({
            kind: 'resource.pay',
            playerId: pid,
            amount: paymentResourceIds.length,
            resorts: Array.from(uniqueResorts) as string[]
        });

        G.engine.effectQueue.push({
            kind: 'influence.formalize',
            playerId: pid,
            resourceIds: paymentResourceIds
        });

        EffectResolver.resolve(G, ctx);

        // Track Start Committee usage
        if (tile.type === TileType.StartCommittee) {
            if (!G.startCommitteeUsed) G.startCommitteeUsed = {};
            G.startCommitteeUsed[pid] = true;
        }

        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },

    // CORE-01-04-20–22: ConvertResources via Grassroots tile
    convertResources: ({ G, ctx, events }: any, { grassrootsTileId, inputResourceIds, extraResourceIds, transferToPlayerId }: { grassrootsTileId: string, inputResourceIds: string[], extraResourceIds?: string[], transferToPlayerId?: string }) => {
        const pid = ctx.currentPlayer;
        const tile = G.tiles[grassrootsTileId];

        if (!tile || tile.type !== TileType.Grassroots) return INVALID_MOVE;

        // EXP-01-08-M07: Debt Brake prohibition
        if (G.secret?.prohibitions?.noConvert) return INVALID_MOVE;

        // Handle Extra Costs (EXP-01/EXP-02/EXP-03)
        if (!handleExtraCosts(G, pid, extraResourceIds, grassrootsTileId, 'CONVERT', transferToPlayerId)) return INVALID_MOVE;

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of inputResourceIds) {
            if (!supply.items.includes(rid)) return INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid) return INVALID_MOVE;
        }

        // EXP-01-08-M03: Collective Bargaining
        if (G.secret?.prohibitions?.noEcoConvert) {
            const hasEco = inputResourceIds.some((rid: string) => G.objects[rid]?.resort === 'ECO');
            if (hasEco) return INVALID_MOVE;
        }

        resolveEffect(G, ctx, {
            type: 'CONVERT',
            payload: { playerId: pid, resourceIds: inputResourceIds, grassrootsTileId }
        }, grassrootsTileId);

        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },

    // CORE-01-04-02: DrawAndPlaceTile — place drawn tile at coord
    placeTile: ({ G, ctx, events }: any, { targetCoord, extraResourceIds, transferToPlayerId, payForInfluenceResourceId }: { targetCoord: string, extraResourceIds?: string[], transferToPlayerId?: string, payForInfluenceResourceId?: string }) => {
        const pid = ctx.currentPlayer;
        const stagingId = `staging_${pid}`;
        const staging = G.zones[stagingId];

        if (!staging || staging.items.length === 0) return INVALID_MOVE;

        const tileId = staging.items[0];
        const tile = G.tiles[tileId];

        // M12 Extreme Weather Event: Placing ResortTiles requires +1 CLM or +1 DOM
        const actionType = tile && tile.type === TileType.Resort ? 'PLACE_RESORT' : 'PLACE_TILE';
        // Handle Extra Costs (EXP-01/EXP-02/EXP-03)
        if (!handleExtraCosts(G, pid, extraResourceIds, undefined, actionType, transferToPlayerId)) return INVALID_MOVE;

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
            const cStr = coordToString(c);
            const tId = G.grid[cStr];
            if (!tId) return;
            const candidateTile = G.tiles[tId];
            // CORE-01-08-06: StartCommittee is immune to all effects
            if (candidateTile && candidateTile.type === TileType.StartCommittee) return;
            if (isSurrounded(c, G.grid)) {
                resolveEffect(G, ctx, {
                    type: 'HOTSPOT_RESOLUTION',
                    payload: { payForInfluenceResourceId }
                }, tId);
            }
        });

        // End Stage → politicalAction
        if (events && events.endStage) {
            events.endStage();
        } else if (events && events.setStage) {
            events.setStage('politicalAction');
        }
    },

    // EXP-01: Take exactly one Measure from OpenMeasures to PlayerHand
    takeMeasure: ({ G, ctx, events }: any, measureObjectId: string) => {
        const pid = ctx.currentPlayer;
        const openZone = G.zones.OpenMeasures;
        if (!openZone || !openZone.items.includes(measureObjectId)) return INVALID_MOVE;

        const handZone = G.zones[`PlayerHand:${pid}`];
        if (!handZone) return INVALID_MOVE;
        // EXP-01-06-03: Hold at most 2 measures
        if (handZone.items.length >= 2) return INVALID_MOVE;

        resolveEffect(G, ctx, {
            type: 'TAKE_MEASURE',
            payload: { playerId: pid, measureObjectId }
        });

        // EXP-01-06-04: TakeMeasure ends the turn immediately
        events.endTurn();
    },

    // EXP-01: Play a Measure from Hand
    playMeasure: ({ G, ctx, events }: any, measureObjectId: string, targetPayload: any) => {
        const pid = ctx.currentPlayer;
        const handZone = G.zones[`PlayerHand:${pid}`];
        if (!handZone || !handZone.items.includes(measureObjectId)) return INVALID_MOVE;

        // EXP-01-06-02: At most one PlayMeasure per round
        if (G.playedMeasureThisRound?.[pid]) return INVALID_MOVE;

        // EXP-03-08-M04: Future Resolution prohibition
        if (G.secret?.prohibitions?.[pid]?.noPlayMeasure) return INVALID_MOVE;

        resolveEffect(G, ctx, {
            type: 'PLAY_MEASURE',
            payload: { playerId: pid, measureObjectId, ...targetPayload }
        });

        // Track PlayMeasure usage
        if (!G.playedMeasureThisRound) G.playedMeasureThisRound = {};
        G.playedMeasureThisRound[pid] = true;

        // Note: Turn does NOT end here (EXP-01-06-05)
    },

    // EXP-03: Place Countdown Marker (Triggered by Transformationsdruck resolution or M01/M03/etc)
    placeCountdownMarker: ({ G, ctx }: any, { targetTileId, extraResourceIds, transferToPlayerId }: { targetTileId: string, extraResourceIds?: string[], transferToPlayerId?: string }) => {
        const pid = ctx.currentPlayer;
        if (!handleExtraCosts(G, pid, extraResourceIds, targetTileId, 'PLACE_COUNTDOWN', transferToPlayerId)) return INVALID_MOVE;

        // Core logic now in expansion handler, but we need the move to be valid
        resolveEffect(G, ctx, {
            type: 'PLACE_COUNTDOWN_EXP03',
            payload: { playerId: pid, targetTileId }
        }, targetTileId);
    },

    // Pass = choose no political action, just end turn
    pass: ({ G, ctx, events }: any) => {
        events.endTurn();
    }
};

/** EXP-01/EXP-02/EXP-03 Helper: Handle extra costs from Measures, Regulations, and Climate */
function handleExtraCosts(G: any, pid: string, extraResourceIds?: string[], onTileId?: string, actionType?: string, transferToPlayerId?: string): boolean {
    let regCost = 0;
    if (onTileId) {
        const regs = getRegulationModifiers(onTileId, G);
        regCost = regs.extraCost;
    }

    let measureExtraCost = (G.secret?.extraCosts?.[pid] || 0);

    // Climate Modifiers
    let climateExtraCost = 0;
    let climateAllowed = ['CLM', 'DOM'];
    if (G.secret?.exp03) {
        const perk = G.secret.playerPerks?.[pid];
        const isImmune = perk?.climateImmunity || perk?.ignoreClimateCosts || G.secret.exp03.ignoreClimateCostThisAction;

        if (!isImmune) {
            if (onTileId && G.secret.exp03.tileCostIncreases?.[onTileId]) climateExtraCost++;
            const tile = G.tiles[onTileId || ''];
            if (tile?.resort && G.secret.exp03.resortCostIncreases?.[tile.resort]) climateExtraCost++;
            if (actionType === 'CONVERT' && G.secret.exp03.convertCostIncrease) {
                climateExtraCost++;
                climateAllowed = ['DOM'];
            }
            if (actionType === 'PLACE_RESORT' && G.secret.exp03.placeResortCostIncrease) climateExtraCost++;
            if (actionType === 'PLACE_COUNTDOWN') {
                if (G.secret.exp03.placeCountdownCostIncrease) climateExtraCost++;
                if (G.secret.exp03.placeCountdownAddedCost) climateExtraCost++;
            }
        }
    }

    // IG Pact (M13) - Transfer exactly 1 component
    let transferred = false;
    if (transferToPlayerId && G.secret?.playerPerks?.[pid]?.transferableCost) {
        if (regCost + measureExtraCost + climateExtraCost > 0) {
            // Transfer 1 component to another player
            // We'll prioritize transferring Measure > Climate > Reg
            let transferTargetId: string | undefined;
            if (measureExtraCost > 0) {
                G.secret.extraCosts[pid]--;
                if (!G.secret.extraCosts[transferToPlayerId]) G.secret.extraCosts[transferToPlayerId] = 0;
                G.secret.extraCosts[transferToPlayerId]++;
                measureExtraCost--;
            } else if (climateExtraCost > 0) {
                climateExtraCost--;
                // Transferee must pay it NOW - this is tricky for a single mover
                // Deterministic implementation: Deduct automatically if possible
                if (!deductResource(G, transferToPlayerId, climateAllowed)) return false;
            } else if (regCost > 0) {
                regCost--;
                if (!deductResource(G, transferToPlayerId, ['ANY'])) return false;
            }
            G.secret.playerPerks[pid].transferableCost = false; // Consumed
            transferred = true;
        }
    }

    const ignoreIncrease = G.secret?.playerPerks?.[pid]?.ignoreCostIncrease || false;
    let finalExtraCost = regCost + measureExtraCost + climateExtraCost;
    if (ignoreIncrease) finalExtraCost = Math.max(0, finalExtraCost - 1);

    if (finalExtraCost > 0) {
        if (!extraResourceIds || extraResourceIds.length < finalExtraCost) return false;

        const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        const bankZone = G.zones[CoreZoneNames.Bank];

        for (let i = 0; i < finalExtraCost; i++) {
            const rid = extraResourceIds[i];
            if (!supply.items.includes(rid)) return false;
            const obj = G.objects[rid];

            // Check Climate validity if we are in the climate portion of costs
            // Simplification: as long as enough resources of correct types are provided
            if (i >= (regCost + measureExtraCost)) {
                if (!climateAllowed.includes(obj.resort!) && !climateAllowed.includes('ANY')) return false;
            }

            // Deduct
            const idx = supply.items.indexOf(rid);
            supply.items.splice(idx, 1);
            bankZone.items.push(rid);
            if (G.objects[rid]) G.objects[rid].owner = undefined;
        }

        // Consume Measure-based cost
        if (G.secret?.extraCosts?.[pid] > 0) {
            G.secret.extraCosts[pid]--;
        }
    }

    // Reset temporary flags
    if (G.secret?.exp03) G.secret.exp03.ignoreClimateCostThisAction = false;

    return true;
}

function deductResource(G: any, pid: string, allowedResorts: string[]): boolean {
    const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
    const supply = G.zones[supplyId];
    for (const rid of supply.items) {
        const obj = G.objects[rid];
        if (obj.type === 'Resource' && (allowedResorts.includes(obj.resort!) || allowedResorts.includes('ANY'))) {
            supply.items.splice(supply.items.indexOf(rid), 1);
            G.zones[CoreZoneNames.Bank].items.push(rid);
            obj.owner = undefined;
            return true;
        }
    }
    return false;
}
