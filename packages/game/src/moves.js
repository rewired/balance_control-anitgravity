"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreMoves = void 0;
const mechanics_1 = require("./mechanics");
const core_1 = require("boardgame.io/core");
const rules_1 = require("@balance-control/rules");
const topology_1 = require("./topology");
// --- Restriction Helpers ---
/** CORE-01-08-01: Max influence cap */
function getInfluenceCap(ctx) {
    return ctx.numPlayers >= 5 ? 8 : 7;
}
/** Count total Influence objects owned by a player */
function countPlayerInfluence(G, pid) {
    let count = 0;
    for (const obj of Object.values(G.objects)) {
        if (obj.type === 'Influence' && obj.owner === pid)
            count++;
    }
    return count;
}
/** CORE-01-08-02: Check if ALL starting influence has been placed on Board by ALL players */
function allStartingInfluencePlaced(G, ctx) {
    // Check every PersonalSupply for any influence marked isStarting
    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const supplyId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        if (!supply)
            continue;
        for (const itemId of supply.items) {
            const obj = G.objects[itemId];
            if (obj && obj.type === 'Influence' && obj.isStarting) {
                return false; // Still has starting influence in supply
            }
        }
    }
    return true;
}
exports.CoreMoves = {
    // CORE-01-04-11: Place exactly one Influence from PersonalSupply to a Board Tile
    placeInfluence: ({ G, ctx, events }, { tileId, extraResourceIds }) => {
        const pid = ctx.currentPlayer;
        const supplyId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        // Handle Extra Costs (EXP-01/EXP-02)
        if (!handleExtraCosts(G, pid, extraResourceIds, tileId))
            return core_1.INVALID_MOVE;
        // CORE-01-08-04: No Influence may be placed on the Start Committee
        const tile = G.tiles[tileId];
        if (tile && tile.type === rules_1.TileType.StartCommittee)
            return core_1.INVALID_MOVE;
        const hasInf = supply.items.some((id) => G.objects[id] && G.objects[id].type === 'Influence');
        if (!hasInf)
            return core_1.INVALID_MOVE;
        if (!G.zones[tileId])
            return core_1.INVALID_MOVE;
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'PLACE_INFLUENCE',
            payload: { playerId: pid, targetTileId: tileId }
        }, tileId);
        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },
    // CORE-01-04-12: Move exactly one Influence from one Board Tile to another
    moveInfluence: ({ G, ctx, events }, { sourceId, targetId, extraResourceIds }) => {
        const pid = ctx.currentPlayer;
        const srcZone = G.zones[sourceId];
        if (!srcZone)
            return core_1.INVALID_MOVE;
        // Handle Extra Costs (EXP-01/EXP-02)
        if (!handleExtraCosts(G, pid, extraResourceIds, targetId))
            return core_1.INVALID_MOVE;
        // CORE-01-04-12: Source must be a Board tile
        const boardZone = G.zones[rules_1.CoreZoneNames.Board];
        if (!boardZone || !boardZone.items.includes(sourceId))
            return core_1.INVALID_MOVE;
        // CORE-01-08-04: No Influence may be placed on the Start Committee
        const targetTile = G.tiles[targetId];
        if (targetTile && targetTile.type === rules_1.TileType.StartCommittee)
            return core_1.INVALID_MOVE;
        const hasInf = srcZone.items.some((id) => G.objects[id]?.owner === pid && G.objects[id].type === 'Influence');
        if (!hasInf)
            return core_1.INVALID_MOVE;
        if (!G.zones[targetId])
            return core_1.INVALID_MOVE;
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'MOVE_INFLUENCE',
            payload: { sourceTileId: sourceId, targetTileId: targetId }
        }, targetId);
        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },
    // CORE-01-04-13–19: FormalizeInfluence via Committee
    formalizeInfluence: ({ G, ctx, events }, { committeeTileId, paymentResourceIds, extraResourceIds }) => {
        const pid = ctx.currentPlayer;
        const tile = G.tiles[committeeTileId];
        if (!tile || (tile.type !== rules_1.TileType.Committee && tile.type !== rules_1.TileType.StartCommittee))
            return core_1.INVALID_MOVE;
        // Handle Extra Costs (EXP-01/EXP-02)
        if (!handleExtraCosts(G, pid, extraResourceIds, committeeTileId))
            return core_1.INVALID_MOVE;
        // CORE-01-08-02/03: Must place all starting influence first
        if (!allStartingInfluencePlaced(G, ctx))
            return core_1.INVALID_MOVE;
        // CORE-01-08-01: Cannot exceed influence cap
        if (countPlayerInfluence(G, pid) >= getInfluenceCap(ctx))
            return core_1.INVALID_MOVE;
        // CORE-01-08-07: Start Committee at most once per game per player
        if (tile.type === rules_1.TileType.StartCommittee) {
            if (G.startCommitteeUsed && G.startCommitteeUsed[pid])
                return core_1.INVALID_MOVE;
        }
        const supplyId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of paymentResourceIds) {
            if (!supply.items.includes(rid))
                return core_1.INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid)
                return core_1.INVALID_MOVE;
        }
        const resources = paymentResourceIds.map((rid) => G.objects[rid]);
        const resorts = resources.map((r) => r.resort);
        // EXP-01-08-M08: Economic Council (Treat 1 non-ECO as ECO)
        const hasEcoPerk = G.secret?.playerPerks?.[pid]?.ecoSubstitute;
        if (hasEcoPerk) {
            const firstNonEcoIdx = resorts.findIndex((r) => r !== 'ECO');
            if (firstNonEcoIdx >= 0) {
                resorts[firstNonEcoIdx] = 'ECO';
                // Consumed
                G.secret.playerPerks[pid].ecoSubstitute = false;
            }
        }
        const uniqueResorts = new Set(resorts);
        if (tile.type === rules_1.TileType.StartCommittee) {
            // CORE-01-08-08: 3 different resorts + 1 any = 4 total
            if (paymentResourceIds.length !== 4)
                return core_1.INVALID_MOVE;
            if (uniqueResorts.size < 3)
                return core_1.INVALID_MOVE;
        }
        else {
            // CORE-01-04-15: 2 Resources of different resorts
            if (paymentResourceIds.length !== 2)
                return core_1.INVALID_MOVE;
            if (uniqueResorts.size < 2)
                return core_1.INVALID_MOVE;
        }
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'FORMALIZE',
            payload: { playerId: pid, resourceIds: paymentResourceIds }
        }, committeeTileId);
        // Track Start Committee usage
        if (tile.type === rules_1.TileType.StartCommittee) {
            if (!G.startCommitteeUsed)
                G.startCommitteeUsed = {};
            G.startCommitteeUsed[pid] = true;
        }
        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },
    // CORE-01-04-20–22: ConvertResources via Grassroots tile
    convertResources: ({ G, ctx, events }, { grassrootsTileId, inputResourceIds, extraResourceIds }) => {
        const pid = ctx.currentPlayer;
        const tile = G.tiles[grassrootsTileId];
        if (!tile || tile.type !== rules_1.TileType.Grassroots)
            return core_1.INVALID_MOVE;
        // EXP-01-08-M07: Debt Brake prohibition
        if (G.secret?.prohibitions?.noConvert)
            return core_1.INVALID_MOVE;
        // Handle Extra Costs (EXP-01/EXP-02)
        if (!handleExtraCosts(G, pid, extraResourceIds, grassrootsTileId))
            return core_1.INVALID_MOVE;
        const supplyId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        for (const rid of inputResourceIds) {
            if (!supply.items.includes(rid))
                return core_1.INVALID_MOVE;
            if (G.objects[rid]?.owner !== pid)
                return core_1.INVALID_MOVE;
        }
        // EXP-01-08-M03: Collective Bargaining
        if (G.secret?.prohibitions?.noEcoConvert) {
            const hasEco = inputResourceIds.some((rid) => G.objects[rid]?.resort === 'ECO');
            if (hasEco)
                return core_1.INVALID_MOVE;
        }
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'CONVERT',
            payload: { playerId: pid, resourceIds: inputResourceIds, grassrootsTileId }
        }, grassrootsTileId);
        // CORE-01-04-09: Exactly one political action per turn
        events.endTurn();
    },
    // CORE-01-04-02: DrawAndPlaceTile — place drawn tile at coord
    placeTile: ({ G, ctx, events }, targetCoord) => {
        const pid = ctx.currentPlayer;
        const stagingId = `staging_${pid}`;
        const staging = G.zones[stagingId];
        if (!staging || staging.items.length === 0)
            return core_1.INVALID_MOVE;
        if (G.grid[targetCoord])
            return core_1.INVALID_MOVE; // Occupied
        const coord = (0, topology_1.stringToCoord)(targetCoord);
        const neighbors = (0, topology_1.getNeighbors)(coord);
        // CORE-01-04-05: Must be adjacent to at least one Board tile
        const hasNeighbor = neighbors.some(n => G.grid[(0, topology_1.coordToString)(n)] !== undefined);
        if (!hasNeighbor) {
            if (Object.keys(G.grid).length > 0)
                return core_1.INVALID_MOVE;
        }
        const tileId = staging.items[0];
        const boardZone = G.zones[rules_1.CoreZoneNames.Board];
        staging.items.shift();
        boardZone.items.push(tileId);
        G.grid[targetCoord] = tileId;
        if (!G.adjacency[tileId])
            G.adjacency[tileId] = [];
        neighbors.forEach(n => {
            const nStr = (0, topology_1.coordToString)(n);
            const nId = G.grid[nStr];
            if (nId) {
                G.adjacency[tileId].push(nId);
                if (!G.adjacency[nId])
                    G.adjacency[nId] = [];
                G.adjacency[nId].push(tileId);
            }
        });
        // CORE-01-06-02/03: Hotspot check — skip StartCommittee (CORE-01-08-06)
        const candidates = [coord, ...neighbors];
        candidates.forEach(c => {
            const cStr = (0, topology_1.coordToString)(c);
            const tId = G.grid[cStr];
            if (!tId)
                return;
            const candidateTile = G.tiles[tId];
            // CORE-01-08-06: StartCommittee is immune to all effects
            if (candidateTile && candidateTile.type === rules_1.TileType.StartCommittee)
                return;
            if ((0, topology_1.isSurrounded)(c, G.grid)) {
                (0, mechanics_1.resolveEffect)(G, ctx, {
                    type: 'HOTSPOT_RESOLUTION',
                    payload: {}
                }, tId);
            }
        });
        // End Stage → politicalAction
        if (events && events.endStage) {
            events.endStage();
        }
        else if (events && events.setStage) {
            events.setStage('politicalAction');
        }
    },
    // EXP-01: Take exactly one Measure from OpenMeasures to PlayerHand
    takeMeasure: ({ G, ctx, events }, measureObjectId) => {
        const pid = ctx.currentPlayer;
        const openZone = G.zones.OpenMeasures;
        if (!openZone || !openZone.items.includes(measureObjectId))
            return core_1.INVALID_MOVE;
        const handZone = G.zones[`PlayerHand:${pid}`];
        if (!handZone)
            return core_1.INVALID_MOVE;
        // EXP-01-06-03: Hold at most 2 measures
        if (handZone.items.length >= 2)
            return core_1.INVALID_MOVE;
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'TAKE_MEASURE',
            payload: { playerId: pid, measureObjectId }
        });
        // EXP-01-06-04: TakeMeasure ends the turn immediately
        events.endTurn();
    },
    // EXP-01: Play a Measure from Hand
    playMeasure: ({ G, ctx, events }, measureObjectId, targetPayload) => {
        const pid = ctx.currentPlayer;
        const handZone = G.zones[`PlayerHand:${pid}`];
        if (!handZone || !handZone.items.includes(measureObjectId))
            return core_1.INVALID_MOVE;
        // EXP-01-06-02: At most one PlayMeasure per round
        if (G.playedMeasureThisRound?.[pid])
            return core_1.INVALID_MOVE;
        (0, mechanics_1.resolveEffect)(G, ctx, {
            type: 'PLAY_MEASURE',
            payload: { playerId: pid, measureObjectId, ...targetPayload }
        });
        // Track PlayMeasure usage
        if (!G.playedMeasureThisRound)
            G.playedMeasureThisRound = {};
        G.playedMeasureThisRound[pid] = true;
        // Note: Turn does NOT end here (EXP-01-06-05)
    },
    // Pass = choose no political action, just end turn
    pass: ({ G, ctx, events }) => {
        events.endTurn();
    }
};
/** EXP-01/EXP-02 Helper: Handle extra costs from Budget Deficit (M06) and Regulations */
function handleExtraCosts(G, pid, extraResourceIds, onTileId) {
    let extraCostCount = (G.secret?.extraCosts?.[pid] || 0);
    // Add Regulation costs if applicable
    if (onTileId) {
        const regs = (0, mechanics_1.getRegulationModifiers)(onTileId, G);
        extraCostCount += regs.extraCost;
    }
    const ignoreIncrease = G.secret?.playerPerks?.[pid]?.ignoreCostIncrease || false;
    const finalExtraCost = ignoreIncrease ? Math.max(0, extraCostCount - 1) : extraCostCount;
    if (finalExtraCost > 0) {
        if (!extraResourceIds || extraResourceIds.length < finalExtraCost)
            return false;
        const supplyId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        const supply = G.zones[supplyId];
        const bankZone = G.zones[rules_1.CoreZoneNames.Bank];
        for (let i = 0; i < finalExtraCost; i++) {
            const rid = extraResourceIds[i];
            if (!supply.items.includes(rid))
                return false;
            // Deduct
            const idx = supply.items.indexOf(rid);
            supply.items.splice(idx, 1);
            bankZone.items.push(rid);
            if (G.objects[rid])
                G.objects[rid].owner = undefined;
        }
        // Consume ONLY the Measure-based cost (M06) if it was part of the total
        // Regulation costs are persistent and not "consumed" by the action.
        if (G.secret?.extraCosts?.[pid] > 0) {
            G.secret.extraCosts[pid]--;
        }
    }
    return true;
}
//# sourceMappingURL=moves.js.map