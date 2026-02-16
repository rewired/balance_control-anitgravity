import { Game } from 'boardgame.io';
import { GameState, CoreZoneNames } from '@balance-control/rules';
import { SetupGame } from './setup';
import { CoreMoves } from './moves';
import { drawTileToStaging } from './mechanics-draw';
import { EffectResolver } from './engine/resolver';
import { ExpansionRegistry } from './expansion-registry';
import { enumerateLegalIntents } from './engine/legal-intents';

export { enumerateLegalIntents };
export type { LegalIntent } from './engine/legal-intents';

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
    endIf: ({ G }: { G: GameState }) => {
        const drawPile = G.zones[CoreZoneNames.DrawPile];
        if (drawPile && drawPile.items.length === 0 && (G as any).roundSettlementDone) {
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
            EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);
            drawTileToStaging(G, ctx);
            EffectResolver.triggerHook(G as any, ctx, 'onTurnBegin', { playerId: ctx.currentPlayer });
        },
        onEnd: ({ G, ctx }: any) => {
            EffectResolver.triggerHook(G as any, ctx, 'onTurnEnd', { playerId: ctx.currentPlayer });
            EffectResolver.resetTurnScopedUsage(G as any, ctx.currentPlayer);
            const lastPlayer = (ctx.numPlayers - 1).toString();
            if (ctx.currentPlayer === lastPlayer) {
                if (!G.roundNumber) G.roundNumber = 0;
                G.roundNumber++;
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
                EffectResolver.resetRoundScopedUsage(G as any);
                const drawPile = G.zones[CoreZoneNames.DrawPile];
                if (drawPile && drawPile.items.length === 0) {
                    G.roundSettlementDone = true;
                }
            }
        }
    }
};
