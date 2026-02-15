import { Game } from 'boardgame.io';
import { GameState, CoreZoneNames, TileType } from '@balance-control/rules';
import { SetupGame } from './setup';
import { positionKeyFromCoordString } from './topology';
import { CoreMoves } from './moves';
import { drawTileToStaging, returnMetaMarkersAtRoundStart, canBeLegallyPlaced } from './mechanics-turn';
import { EffectResolver } from './engine/resolver';
import { ExpansionRegistry } from './expansion-registry';

const expansionMoves = ExpansionRegistry.getMergedMoves();
const politicalActionMoves = {
    placeInfluence: CoreMoves.placeInfluence,
    moveInfluence: CoreMoves.moveInfluence,
    formalizeInfluence: CoreMoves.formalizeInfluence,
    convertResources: CoreMoves.convertResources,
    pass: CoreMoves.pass,
    resolveChoice: CoreMoves.resolveChoice,
    ...expansionMoves
};

function isZoneVisible(zoneId: string, playerID: string): boolean {
    if (zoneId.startsWith('staging_')) return zoneId === `staging_${playerID}`;
    if (zoneId.startsWith(`${CoreZoneNames.PersonalSupply}:`)) {
        return zoneId === `${CoreZoneNames.PersonalSupply}:${playerID}`;
    }
    if (zoneId.startsWith(`${CoreZoneNames.PlayerHand}:`)) {
        return zoneId === `${CoreZoneNames.PlayerHand}:${playerID}`;
    }
    return true;
}

function buildPlayerView(G: GameState, playerID?: string | null): GameState {
    if (!playerID) return G;
    const zones: GameState['zones'] = {};
    const objectIds = new Set<string>();

    for (const [zoneId, zone] of Object.entries(G.zones)) {
        if (!isZoneVisible(zoneId, playerID)) continue;
        zones[zoneId] = zone;
        for (const itemId of zone.items) {
            objectIds.add(itemId);
        }
    }

    const objects: GameState['objects'] = {};
    for (const itemId of objectIds) {
        const obj = G.objects[itemId];
        if (obj) objects[itemId] = obj;
    }

    const engine = { ...G.engine };
    if (engine.pendingChoice && engine.pendingChoice.player !== playerID) {
        engine.pendingChoice = undefined;
    }

    return { ...G, zones, objects, engine };
}

export const BalanceControl: Game<GameState> = {
    name: 'balance-control',
    setup: (ctx: any, setupData: unknown) => SetupGame({ ctx, setupData }),
    moves: {
        ...CoreMoves,
        ...expansionMoves
    },
    playerView: ({ G, playerID }: { G: GameState; playerID: string | null }) => {
        return buildPlayerView(G, playerID);
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
                    placeTile: CoreMoves.placeTile,
                    passTilePlacement: CoreMoves.passTilePlacement
                },
                next: 'politicalAction'
            },
            politicalAction: {
                moves: politicalActionMoves
            }
        },
        onBegin: ({ G, ctx }: any) => {
            if (ctx.currentPlayer === '0') {
                returnMetaMarkersAtRoundStart(G as any);
            }
            EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);
            drawTileToStaging(G, ctx);
            // CORE-01-09-01A / VAR-01-01-08: Flag when DrawPile empty or no legal placement (staging stays empty)
            const drawPile = G.zones[CoreZoneNames.DrawPile];
            const stagingId = `staging_${ctx.currentPlayer}`;
            const staging = G.zones[stagingId];
            const stagingEmpty = !staging || staging.items.length === 0;
            if (stagingEmpty && (drawPile?.items.length === 0 || !canBeLegallyPlaced(G))) {
                G.engine.attributes.drawPileEmptyAtTurnStart = true;
            }
            EffectResolver.triggerHook(G as any, ctx, 'onTurnBegin', { playerId: ctx.currentPlayer });
        },
        onEnd: ({ G, ctx }: any) => {
            EffectResolver.triggerHook(G as any, ctx, 'onTurnEnd', { playerId: ctx.currentPlayer });
            EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);

            // CORE-01-07-02: After last player, Round Settlement
            const lastPlayer = (ctx.numPlayers - 1).toString();
            if (ctx.currentPlayer === lastPlayer) {
                // Gap 11: Round counter
                if (!G.roundNumber) G.roundNumber = 0;
                G.roundNumber++;

                // CORE-01-07-03D: Round Settlement — resolve production in ascending PositionKey order
                const boardZone = G.zones[CoreZoneNames.Board];
                const grid = G.grid ?? {};
                if (boardZone) {
                    const resortTilesWithCoord: { tileId: string; posKey: string }[] = [];
                    for (const tileId of boardZone.items) {
                        const tile = G.tiles[tileId];
                        if (tile?.type !== TileType.Resort) continue;
                        const coordStr = Object.entries(grid).find(([, id]) => id === tileId)?.[0];
                        if (coordStr) {
                            resortTilesWithCoord.push({ tileId, posKey: positionKeyFromCoordString(coordStr) });
                        } else {
                            resortTilesWithCoord.push({ tileId, posKey: tileId });
                        }
                    }
                    resortTilesWithCoord.sort((a, b) => a.posKey.localeCompare(b.posKey));
                    for (const { tileId } of resortTilesWithCoord) {
                        (G as any).engine.effectQueue.push({ kind: 'production.resolve', tileId });
                    }
                    EffectResolver.resolve(G as any, ctx);
                }

                EffectResolver.triggerHook(G as any, ctx, 'onRoundEnd');
                EffectResolver.resetRoundScopedUsage(G as any);

                // Check if draw pile is empty → flag for endIf
                const drawPile = G.zones[CoreZoneNames.DrawPile];
                if (drawPile && drawPile.items.length === 0) {
                    G.roundSettlementDone = true;
                }
            }
        }
    }
};

export { ExpansionRegistry } from './expansion-registry';
export * from './move-contracts';
export * from './config';
export * from './hash-state';
export * from './engine/legal-intents';
