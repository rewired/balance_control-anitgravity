import { Game } from 'boardgame.io';
import { GameState, CoreZoneNames, TileType } from '@balance-control/rules';
import { SetupGame } from './setup';
import { positionKeyFromCoordString } from './topology';
import { drawTileToStaging } from './mechanics-draw';
import { EffectResolver } from './engine/resolver';
import { assemblePacks, buildStageMoveMap, type MoveMap } from './move-assembly';
import { ensureCorePackRegistered } from './packs/register-core';
import { validateSurfaceHash } from './surface';

const CORE_POLITICAL_MOVE_IDS = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources', 'resolveChoice'] as const;
const DRAW_AND_PLACE_MOVE_IDS = ['placeTile', 'passTilePlacement'] as const;

function selectMoves(mergedMoves: MoveMap, moveIds: readonly string[], stageName: string): MoveMap {
    const out: MoveMap = {};
    for (const moveId of moveIds) {
        const move = mergedMoves[moveId];
        if (typeof move !== 'function') {
            throw new Error(
                `Core pack not registered or missing required move "${moveId}" for ${stageName}. Register CorePack before calling createBalanceControlGame().`
            );
        }
        out[moveId] = move;
    }
    return out;
}

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

function makeDrawPilePlaceholders(count: number, forbiddenIds: Set<string>): string[] {
    const placeholders: string[] = [];
    for (let i = 0; i < count; i++) {
        let attempt = 0;
        let id = `__drawpile_${i}`;
        while (forbiddenIds.has(id)) {
            attempt += 1;
            id = `__drawpile_${i}_${attempt}`;
        }
        placeholders.push(id);
        forbiddenIds.add(id);
    }
    return placeholders;
}

function buildPlayerView(G: GameState, playerID?: string | null): GameState {
    if (!playerID) return G;
    const zones: GameState['zones'] = {};
    const objectIds = new Set<string>();
    const visibleTileIds = new Set<string>();

    const forbiddenPlaceholderIds = new Set<string>([...Object.keys(G.tiles), ...Object.keys(G.objects)]);
    const drawPile = G.zones[CoreZoneNames.DrawPile];
    const maskedDrawPileItems = drawPile ? makeDrawPilePlaceholders(drawPile.items.length, forbiddenPlaceholderIds) : [];

    for (const [zoneId, zone] of Object.entries(G.zones)) {
        if (!isZoneVisible(zoneId, playerID)) continue;

        if (zoneId === CoreZoneNames.DrawPile) {
            zones[zoneId] = { ...zone, items: maskedDrawPileItems };
            for (const itemId of maskedDrawPileItems) {
                objectIds.add(itemId);
            }
            continue;
        }

        zones[zoneId] = zone;
        for (const itemId of zone.items) {
            objectIds.add(itemId);
            if (G.tiles[itemId]) visibleTileIds.add(itemId);
        }
    }

    const tiles: GameState['tiles'] = {};
    for (const tileId of visibleTileIds) {
        tiles[tileId] = G.tiles[tileId];
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

    return { ...G, zones, objects, tiles, engine };
}

export function createBalanceControlGame(): Game<GameState> {
    ensureCorePackRegistered();
    const packAssembly = assemblePacks({ mode: 'registered' });
    const moveModules = packAssembly.moveModules;
    const mergedMoves = packAssembly.moves;
    const expansionModules = packAssembly.expansionMoveModules;
    const politicalCoreMoves = selectMoves(mergedMoves, CORE_POLITICAL_MOVE_IDS, 'politicalAction');
    const drawAndPlaceMoves = selectMoves(mergedMoves, DRAW_AND_PLACE_MOVE_IDS, 'drawAndPlace');
    const politicalActionMoves = buildStageMoveMap(politicalCoreMoves, expansionModules);

    return {
        name: 'balance-control',
        setup: (ctx: any, setupData: unknown) => SetupGame({ ctx, setupData }),
        moves: mergedMoves as any,
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
                    moves: drawAndPlaceMoves,
                    next: 'politicalAction',
                },
                politicalAction: {
                    moves: politicalActionMoves,
                },
            },
            onBegin: ({ G, ctx }: any) => {
                validateSurfaceHash(G);
                EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);
                drawTileToStaging(G, ctx);
                // CORE-01-09-01A: Flag when DrawPile is empty and no tile is staged (skip Political Action)
                const drawPile = G.zones[CoreZoneNames.DrawPile];
                const stagingId = `staging_${ctx.currentPlayer}`;
                const staging = G.zones[stagingId];
                const stagingEmpty = !staging || staging.items.length === 0;
                if (stagingEmpty && drawPile?.items.length === 0) {
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
            },
        },
    };
}

export { EnginePackRegistry, packFromExpansionDefinition } from './expansion-registry';
export type { EnginePackDefinition, EnginePackId } from './packs/types';
export { CorePack } from './packs/core';
export { Exp01Pack } from './packs/exp01';
export { Exp02Pack } from './packs/exp02';
export { Exp03Pack } from './packs/exp03';
export * from './move-contracts';
export * from './config';
export * from './hash-state';
export * from './surface';
export * from './engine/legal-intents';
export { selectTileController } from './public-selectors';
