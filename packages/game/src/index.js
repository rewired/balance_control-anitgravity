"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceControl = exports.ExpansionRegistry = void 0;
const rules_1 = require("@balance-control/rules");
const setup_1 = require("./setup");
const moves_1 = require("./moves");
const mechanics_turn_1 = require("./mechanics-turn");
const mechanics_1 = require("./mechanics");
var expansion_registry_1 = require("./expansion-registry");
Object.defineProperty(exports, "ExpansionRegistry", { enumerable: true, get: function () { return expansion_registry_1.ExpansionRegistry; } });
exports.BalanceControl = {
    name: 'balance-control',
    setup: setup_1.SetupGame,
    moves: moves_1.CoreMoves,
    // CORE-01-09-01: End when DrawPile is empty
    endIf: ({ G }) => {
        const drawPile = G.zones[rules_1.CoreZoneNames.DrawPile];
        if (drawPile && drawPile.items.length === 0 && G.roundSettlementDone) {
            // CORE-01-09-03: Count Influence ON BOARD tiles only
            const scores = {};
            const boardZone = G.zones[rules_1.CoreZoneNames.Board];
            if (boardZone) {
                for (const tileId of boardZone.items) {
                    const tileZone = G.zones[tileId];
                    if (!tileZone)
                        continue;
                    for (const itemId of tileZone.items) {
                        const obj = G.objects[itemId];
                        if (obj && obj.type === 'Influence' && obj.owner) {
                            scores[obj.owner] = (scores[obj.owner] || 0) + 1;
                        }
                    }
                }
            }
            const maxScore = Math.max(...Object.values(scores), 0);
            const winners = Object.entries(scores)
                .filter(([_, s]) => s === maxScore)
                .map(([p]) => p);
            if (winners.length === 1) {
                return { winner: winners[0] };
            }
            // CORE-01-09-04: Shared victory on tie
            return { draw: true };
        }
    },
    turn: {
        activePlayers: {
            currentPlayer: 'drawAndPlace',
        },
        stages: {
            drawAndPlace: {
                moves: {
                    placeTile: moves_1.CoreMoves.placeTile
                },
                next: 'politicalAction'
            },
            politicalAction: {
                moves: {
                    placeInfluence: moves_1.CoreMoves.placeInfluence,
                    moveInfluence: moves_1.CoreMoves.moveInfluence,
                    formalizeInfluence: moves_1.CoreMoves.formalizeInfluence,
                    convertResources: moves_1.CoreMoves.convertResources,
                    takeMeasure: moves_1.CoreMoves.takeMeasure,
                    playMeasure: moves_1.CoreMoves.playMeasure,
                    pass: moves_1.CoreMoves.pass
                }
            }
        },
        onBegin: ({ G, ctx }) => {
            (0, mechanics_turn_1.drawTileToStaging)(G, ctx);
        },
        onEnd: ({ G, ctx }) => {
            // EXP-01/02 Turn Reset
            const pid = ctx.currentPlayer;
            if (G.secret) {
                if (G.secret.playerPerks?.[pid]) {
                    delete G.secret.playerPerks[pid].ignoreCostIncrease;
                }
                if (G.secret.playerProhibitions?.[pid]) {
                    delete G.secret.playerProhibitions[pid].ignoreMeasureModifiers;
                }
                // EXP-02 M05 Reset
                if (G.secret.exp02) {
                    delete G.secret.exp02.administrationOnAuthority;
                }
            }
            // CORE-01-07-02: After last player, Round Settlement
            const lastPlayer = (ctx.numPlayers - 1).toString();
            if (ctx.currentPlayer === lastPlayer) {
                // Gap 11: Round counter
                if (!G.roundNumber)
                    G.roundNumber = 0;
                G.roundNumber++;
                // Round Settlement: resolve production for all Resort tiles on Board
                const boardZone = G.zones[rules_1.CoreZoneNames.Board];
                if (boardZone) {
                    for (const tileId of boardZone.items) {
                        (0, mechanics_1.resolveProduction)(tileId, G);
                    }
                }
                // Check if draw pile is empty → flag for endIf
                const drawPile = G.zones[rules_1.CoreZoneNames.DrawPile];
                if (drawPile && drawPile.items.length === 0) {
                    G.roundSettlementDone = true;
                }
                // Reset Flags (EXP-01 & EXP-02)
                G.playedMeasureThisRound = {};
                if (G.secret) {
                    G.secret.doublingEffects = {};
                    G.secret.productionReductions = {};
                    G.secret.prohibitedHotspots = [];
                    // Perks Reset
                    if (G.secret.playerPerks) {
                        for (const p of Object.keys(G.secret.playerPerks)) {
                            delete G.secret.playerPerks[p].ecoSubstitute;
                            delete G.secret.playerPerks[p].regDiscount;
                        }
                    }
                    // EXP-02 Round Resets
                    if (G.secret.exp02) {
                        G.secret.exp02.secSubstitution = false;
                        G.secret.exp02.extraRegCost = 0;
                        G.secret.exp02.protectedTiles = [];
                        G.secret.exp02.doubledRegs = [];
                    }
                    // Carry over nextRoundProhibitions to current prohibitions
                    G.secret.prohibitions = { ...G.secret.nextRoundProhibitions };
                    G.secret.nextRoundProhibitions = {};
                }
            }
        }
    }
};
//# sourceMappingURL=index.js.map