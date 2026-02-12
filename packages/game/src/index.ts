import { Game } from 'boardgame.io';
import { GameState, CoreZoneNames } from '@balance-control/rules';
import { SetupGame } from './setup';
import { CoreMoves } from './moves';
import { drawTileToStaging } from './mechanics-turn';
import { resolveProduction } from './mechanics';
export { ExpansionRegistry } from './expansion-registry';

export const BalanceControl: Game<GameState> = {
    name: 'balance-control',
    setup: SetupGame,
    moves: CoreMoves,

    // CORE-01-09-01: End when DrawPile is empty
    endIf: ({ G }: { G: GameState }) => {
        const drawPile = G.zones[CoreZoneNames.DrawPile];
        if (drawPile && drawPile.items.length === 0 && (G as any).roundSettlementDone) {
            // CORE-01-09-03: Count Influence ON BOARD tiles only
            const scores: Record<string, number> = {};
            const boardZone = G.zones[CoreZoneNames.Board];
            if (boardZone) {
                for (const tileId of boardZone.items) {
                    const tileZone = G.zones[tileId];
                    if (!tileZone) continue;
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
                    placeTile: CoreMoves.placeTile
                },
                next: 'politicalAction'
            },
            politicalAction: {
                moves: {
                    placeInfluence: CoreMoves.placeInfluence,
                    moveInfluence: CoreMoves.moveInfluence,
                    formalizeInfluence: CoreMoves.formalizeInfluence,
                    convertResources: CoreMoves.convertResources,
                    takeMeasure: CoreMoves.takeMeasure,
                    playMeasure: CoreMoves.playMeasure,
                    pass: CoreMoves.pass
                }
            }
        },
        onBegin: ({ G, ctx }: any) => {
            drawTileToStaging(G, ctx);
            const pid = ctx.currentPlayer;
            // EXP-03: Clear "until beginning of your next turn" effects owned by pid
            if (G.secret?.exp03) {
                const s = G.secret.exp03;
                if (s.tileCostIncreases) {
                    for (const k in s.tileCostIncreases) if (s.tileCostIncreases[k].until === 'nextTurn' && s.tileCostIncreases[k].owner === pid) delete s.tileCostIncreases[k];
                }
                if (s.noInfluenceUntilNextTurn && s.noInfluenceOwner === pid) delete s.noInfluenceUntilNextTurn;
                if (s.noMajorityInfluenceUntilNextTurn && s.noMajorityOwner === pid) delete s.noMajorityInfluenceUntilNextTurn;
                if (s.placeResortCostIncrease && s.placeResortOwner === pid) delete s.placeResortCostIncrease;
                if (s.placeCountdownCostIncrease && s.placeCountdownOwner === pid) delete s.placeCountdownCostIncrease;
                if (s.convertCostIncrease && s.convertCostOwner === pid) delete s.convertCostIncrease;
            }
        },
        onEnd: ({ G, ctx }: any) => {
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
                if (!G.roundNumber) G.roundNumber = 0;
                G.roundNumber++;

                // Round Settlement: resolve production for all Resort tiles on Board
                const boardZone = G.zones[CoreZoneNames.Board];
                if (boardZone) {
                    for (const tileId of boardZone.items) {
                        resolveProduction(tileId, G);
                    }
                }

                // Check if draw pile is empty → flag for endIf
                const drawPile = G.zones[CoreZoneNames.DrawPile];
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

                    // EXP-03 Round/RoundNext Resets
                    if (G.secret.exp03) {
                        const s = G.secret.exp03;
                        // M02: End of next round means it survives one full round cycle
                        if (s.resortCostIncreases) {
                            for (const k in s.resortCostIncreases) {
                                if (s.resortCostIncreases[k].until === 'endThisRound') delete s.resortCostIncreases[k];
                                else if (s.resortCostIncreases[k].until === 'endNextRound') s.resortCostIncreases[k].until = 'endThisRound';
                            }
                        }
                    }
                }
            }
        }
    }
};
