import { Game } from 'boardgame.io';
import { GameState, CoreZoneName, TileType } from '@balance-control/rules';
import { SetupGame } from './setup';
import { drawTileToStaging } from './mechanics-draw';
import { getRoundSettlementResortTileOrder, runFinalRoundSettlement } from './mechanics-turn';
import { EffectResolver } from './engine/resolver';
import { assemblePacks, buildStageMoveMap, type MoveMap } from './move-assembly';
import { ensureCorePackRegistered } from './packs/register-core';
import { validateSurfaceHash } from './surface';
import { emitReplaySystemRecord, withReplaySink, type ReplayHookOptions } from './engine/replay-sink';

const ROOT_SYSTEM_MOVE_IDS = ['resolveChoice'] as const;
const CORE_POLITICAL_MOVE_IDS = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources', 'resolveChoice'] as const;
const DRAW_AND_PLACE_MOVE_IDS = ['placeTile', 'resolveChoice'] as const;

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
    // PersonalSupply is now public (Task 0207)
    if (zoneId.startsWith(`${CoreZoneName.PlayerHand}:`)) {
        return zoneId === `${CoreZoneName.PlayerHand}:${playerID}`;
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
    const drawPile = G.zones[CoreZoneName.DrawPile];
    const maskedDrawPileItems = drawPile ? makeDrawPilePlaceholders(drawPile.items.length, forbiddenPlaceholderIds) : [];

    for (const [zoneId, zone] of Object.entries(G.zones)) {
        if (!isZoneVisible(zoneId, playerID)) continue;

        if (zoneId === CoreZoneName.DrawPile) {
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

    return { ...G, _isPlayerView: true, zones, objects, tiles, engine } as any;
}

function computeCoreGameover(G: GameState): { winner: string } | { draw: true } {
    // CORE-01-09-03: Count Influence ON BOARD tiles only
    const scores: Record<string, number> = {};
    const boardZone = G.zones[CoreZoneName.Board];
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

function shouldEndByNoLegalPlacements(G: GameState): boolean {
    return Boolean(G.engine?.attributes?.endedByNoLegalPlacements);
}

function shouldAutoFinalSettlement(G: GameState, ctx: any): boolean {
    if ((G as any).roundSettlementDone) return false;
    if (G.engine?.pendingChoice) return false;
    const attrs = G.engine?.attributes ?? {};
    if (!attrs.drawPileEmptyAtTurnStart && !attrs.noLegalPlacements) return false;

    const stagingId = `staging_${ctx.currentPlayer}`;
    const staging = G.zones[stagingId];
    const stagingEmpty = !staging || staging.items.length === 0;
    if (!stagingEmpty) return false;

    return true;
}

/**
 * Factory for creating the Balance Control game configuration.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function createBalanceControlGame(): Game<GameState> {
    return createBalanceControlGameWithHooks();
}

/**
 * Factory for creating the Balance Control game configuration with optional infrastructure hooks.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function createBalanceControlGameWithHooks(replayHook?: ReplayHookOptions): Game<GameState> {
    ensureCorePackRegistered();
    const packAssembly = assemblePacks({ mode: 'registered' });
    const moveModules = packAssembly.moveModules;
    const mergedMoves = withReplaySink(packAssembly.moves, replayHook);
    const expansionModules = moveModules.filter((module) => module.moduleId !== 'core').map((module) => {
        const wrappedModuleMoves: MoveMap = {};
        for (const moveId of Object.keys(module.moves)) {
            const wrappedMove = mergedMoves[moveId];
            if (typeof wrappedMove === 'function') {
                wrappedModuleMoves[moveId] = wrappedMove;
            }
        }
        return {
            ...module,
            moves: wrappedModuleMoves,
        };
    });
    const rootSystemMoves = selectMoves(mergedMoves, ROOT_SYSTEM_MOVE_IDS, 'root/system');
    const politicalCoreMoves = selectMoves(mergedMoves, CORE_POLITICAL_MOVE_IDS, 'politicalAction');
    const drawAndPlaceMoves = selectMoves(mergedMoves, DRAW_AND_PLACE_MOVE_IDS, 'drawAndPlace');
    const politicalActionMoves = buildStageMoveMap(politicalCoreMoves, expansionModules);

    return {
        name: 'balance-control',
        setup: (ctx: any, setupData: unknown) => SetupGame({ ctx, setupData }),
        moves: rootSystemMoves as any,
        playerView: ({ G, playerID }: { G: GameState; playerID: string | null }) => {
            return buildPlayerView(G, playerID);
        },

        // CORE-01-09-01: End when DrawPile is empty
        // VAR-01-01-08: If no legal placements exist, treat as DrawPile empty for termination.
        endIf: ({ G }: { G: GameState }) => {
            const drawPile = G.zones[CoreZoneName.DrawPile];
            const shouldEndForDrawPile = Boolean(drawPile && drawPile.items.length === 0);
            if (!(G as any).roundSettlementDone) return;
            if (!shouldEndForDrawPile && !shouldEndByNoLegalPlacements(G)) return;
            return computeCoreGameover(G);
        },

        /**
         * @rule CORE-01-04-01
         * @rule CORE-01-04-03
         */
        turn: {
            /** @rule CORE-01-03-03A */
            order: {
                first: ({ G }: { G: GameState }) => G.engine.attributes.startingPlayerIndex ?? 0,
                next: ({ ctx }: { ctx: any }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
            },
            activePlayers: {
                currentPlayer: 'drawAndPlace',
                others: 'choice',
            },
            stages: {
                drawAndPlace: {
                    moves: drawAndPlaceMoves,
                    next: 'politicalAction',
                },
                politicalAction: {
                    moves: politicalActionMoves,
                },
                choice: {
                    moves: rootSystemMoves,
                },
            },
            onBegin: ({ G, ctx, events }: any) => {
                validateSurfaceHash(G);
                EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);
                drawTileToStaging(G, ctx);
                EffectResolver.triggerHook(G as any, ctx, 'onTurnBegin', { playerId: ctx.currentPlayer });

                // CORE-01-09-01A / VAR-01-01-08: Automatic final settlement trigger (no player action).
                if (shouldAutoFinalSettlement(G, ctx)) {
                    const attrs = G.engine.attributes ?? {};
                    const endedByNoLegalPlacements = Boolean(attrs.noLegalPlacements);
                    delete attrs.drawPileEmptyAtTurnStart;
                    delete attrs.noLegalPlacements;
                    if (endedByNoLegalPlacements) {
                        attrs.endedByNoLegalPlacements = true;
                    }
                    G.engine.attributes = attrs;

                    if (!G.roundNumber) G.roundNumber = 0;
                    G.roundNumber++;
                    const resortTileOrder = runFinalRoundSettlement(G as any, ctx);
                    G.roundSettlementDone = true;

                    const drawPile = G.zones[CoreZoneName.DrawPile];
                    const shouldEndForDrawPile = Boolean(drawPile && drawPile.items.length === 0);
                    const shouldEnd = shouldEndForDrawPile || endedByNoLegalPlacements;

                    // Emit after deterministic settlement mutations to keep system record hashes verifier-aligned.
                    emitReplaySystemRecord(replayHook, { G, ctx }, {
                        roundNumber: G.roundNumber,
                        settlementKind: 'final',
                        resortTileOrder,
                    });

                    if (shouldEnd && typeof events?.endGame === 'function') {
                        events.endGame(computeCoreGameover(G));
                    }
                }
            },
            onEnd: ({ G, ctx }: any) => {
                EffectResolver.triggerHook(G as any, ctx, 'onTurnEnd', { playerId: ctx.currentPlayer });
                EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);

                // Safety: if final settlement already ran and termination is satisfied, do not run another settlement pass.
                const drawPile = G.zones[CoreZoneName.DrawPile];
                const shouldEndForDrawPile = Boolean(drawPile && drawPile.items.length === 0);
                if ((G as any).roundSettlementDone && (shouldEndForDrawPile || shouldEndByNoLegalPlacements(G))) {
                    return;
                }

                // CORE-01-07-01 / CORE-01-07-02: After last player, Round Settlement
                const startingPlayerIndex = G.engine.attributes.startingPlayerIndex ?? 0;
                const lastPlayerIndex = (startingPlayerIndex + ctx.numPlayers - 1) % ctx.numPlayers;
                if (ctx.currentPlayer === String(lastPlayerIndex)) {
                    // Gap 11: Round counter
                    if (!G.roundNumber) G.roundNumber = 0;
                    G.roundNumber++;

                    // CORE-01-07-03D: Round Settlement — resolve production in ascending PositionKey order
                    const resortTileOrder = getRoundSettlementResortTileOrder(G as any);
                    for (const tileId of resortTileOrder) {
                        (G as any).engine.effectQueue.push({ kind: 'production.resolve', tileId });
                    }
                    EffectResolver.resolve(G as any, ctx);

                    EffectResolver.triggerHook(G as any, ctx, 'onRoundEnd');
                    EffectResolver.resetRoundScopedUsage(G as any);

                    // Check if draw pile is empty → flag for endIf
                    const drawPile = G.zones[CoreZoneName.DrawPile];
                    if (drawPile && drawPile.items.length === 0) {
                        G.roundSettlementDone = true;
                    }

                    // Emit after all deterministic round-settlement mutations to keep hashes post-settlement.
                    emitReplaySystemRecord(replayHook, { G, ctx }, {
                        roundNumber: G.roundNumber,
                        settlementKind: 'regular',
                        resortTileOrder,
                    });
                }
            },
        },
    };
}

/** @rule CORE-01-09-02 */

export { EnginePackRegistry } from './expansion-registry';
export type { EnginePackDefinition, EnginePackId, PackManifest } from './packs/types';
export { CorePack } from './packs/core';
export * from './move-contracts';
export * from './config';
export * from './hash-state';
export * from './surface';
export * from './engine/legal-intents';
export { selectTileController } from './public-selectors';
export { assemblePacks } from './move-assembly';
export { CANONICAL_ENGINE_MODULE_ORDER } from './expansion-registry';

// Internal APIs exposed for pack implementations in @balance-control/packs
export { EffectResolver } from './engine/resolver';
export { lookupMeasureDeckForObjectId } from './engine/measure-deck-provider';
export { exp02RegulationAtoms } from './engine/atoms/regulation';
export { exp03CountdownAtoms } from './engine/atoms/countdown';

export type {
    ReplayActionRecord,
    ReplayRecord,
    ReplaySink,
    ReplayHookOptions,
    ReplaySystemRoundSettlementRecord,
} from './engine/replay-sink';
export type { ReplayDomainFieldType, ReplayTypedFields } from './engine/replay-typed-fields';
