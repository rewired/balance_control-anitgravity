import { Game } from 'boardgame.io';
import { GameState, CoreZoneNames } from '@balance-control/rules';
import { SetupGame } from './setup';
import { CoreMoves } from './moves';
import { drawTileToStaging } from './mechanics-turn';
import { EffectResolver } from './engine/resolver';
import { ExpansionRegistry } from './expansion-registry';

export const BalanceControl: Game<GameState> = {
    name: 'balance-control',
    setup: SetupGame,
    moves: {
        ...CoreMoves,
        ...ExpansionRegistry.getMergedMoves()
    },

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
                    ...CoreMoves,
                    ...ExpansionRegistry.getMergedMoves()
                }
            }
        },
        onBegin: ({ G, ctx }: any) => {
            drawTileToStaging(G, ctx);
            EffectResolver.triggerHook(G as any, ctx, 'onTurnBegin', { playerId: ctx.currentPlayer });
        },
        onEnd: ({ G, ctx }: any) => {
            EffectResolver.triggerHook(G as any, ctx, 'onTurnEnd', { playerId: ctx.currentPlayer });

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
                        (G as any).engine.effectQueue.push({
                            kind: 'production.resolve',
                            tileId
                        });
                    }
                    EffectResolver.resolve(G as any, ctx);
                }

                EffectResolver.triggerHook(G as any, ctx, 'onRoundEnd');

                // Check if draw pile is empty → flag for endIf
                const drawPile = G.zones[CoreZoneNames.DrawPile];
                if (drawPile && drawPile.items.length === 0) {
                    G.roundSettlementDone = true;
                }
            }
        }
    }
};
