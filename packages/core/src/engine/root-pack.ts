import { CoreZoneName, type GameState } from '@balance-control/rules';
import { type RootTurnDescriptor, EffectResolver, validateSurfaceHash } from '@balance-control/game';
import { drawTileToStaging } from '../mechanics-draw';
import { getRoundSettlementResortTileOrder, runFinalRoundSettlement } from '../mechanics-turn';
import { emitReplaySystemRecord } from './replay';

const ROOT_MOVE_IDS = ['resolveChoice'] as const;
const POLITICAL_ACTION_MOVE_IDS = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources', 'resolveChoice'] as const;
const DRAW_AND_PLACE_MOVE_IDS = ['placeTile', 'resolveChoice'] as const;

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

/**
 * CORE player-view masking: draw pile is opaque, opponents' staging/hand
 * zones are hidden, pending choices not addressed to this player are hidden.
 * @rule CORE-01-00-03
 * @rule CORE-01-00-04
 */
export function buildCorePlayerView(G: GameState, playerID?: string | null): GameState {
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

/** @rule CORE-01-09-03 */
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
 * CORE-01-09-01/03/04: game ends when the draw pile is empty (or no legal
 * placements remain); winner is the player with the most on-board Influence,
 * shared victory on a tie.
 * @rule CORE-01-09-01
 * @rule CORE-01-09-03
 * @rule CORE-01-09-04
 */
export function coreEndIf({ G }: { G: GameState }): { winner: string } | { draw: true } | undefined {
    const drawPile = G.zones[CoreZoneName.DrawPile];
    const shouldEndForDrawPile = Boolean(drawPile && drawPile.items.length === 0);
    if (!(G as any).roundSettlementDone) return undefined;
    if (!shouldEndForDrawPile && !shouldEndByNoLegalPlacements(G)) return undefined;
    return computeCoreGameover(G);
}

/**
 * CORE root turn structure: draw-and-place, then political action for the
 * current player, with other players in a reactive choice stage.
 * @rule CORE-01-04-01
 * @rule CORE-01-04-03
 */
export const coreRootTurn: RootTurnDescriptor = {
    /** @rule CORE-01-03-03A */
    order: {
        first: ({ G }) => G.engine.attributes.startingPlayerIndex ?? 0,
        next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    activePlayers: {
        currentPlayer: 'drawAndPlace',
        others: 'choice',
    },
    stages: {
        drawAndPlace: { moves: [...DRAW_AND_PLACE_MOVE_IDS], next: 'politicalAction' },
        politicalAction: { moves: [...POLITICAL_ACTION_MOVE_IDS], mergeExpansionMoves: true },
        choice: { moves: [...ROOT_MOVE_IDS] },
    },
    rootMoveIds: [...ROOT_MOVE_IDS],
    onBegin: ({ G, ctx, events, replayHook }) => {
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
            (G as any).roundSettlementDone = true;

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
    onEnd: ({ G, ctx, replayHook }) => {
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
            if (drawPile && drawPile.items.length === 0) {
                (G as any).roundSettlementDone = true;
            }

            // Emit after all deterministic round-settlement mutations to keep hashes post-settlement.
            emitReplaySystemRecord(replayHook, { G, ctx }, {
                roundNumber: G.roundNumber,
                settlementKind: 'regular',
                resortTileOrder,
            });
        }
    },
};
