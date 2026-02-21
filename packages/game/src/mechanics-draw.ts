import { CoreZoneName, GameState } from '@balance-control/rules';
import { enumerateLegalIntents } from './engine/legal-intents';
import { hasAnyOpenPlacement } from './moves/stages/drawAndPlace';

export const UNPLACEABLE_DRAW_CHOICE_SOURCE_ID = 'system.tile.unplaceable.confirm';
const PUBLIC_LOG_CAP = 20;

export interface PublicLogEntryTileUnplaceable {
    id: string;
    kind: 'tile.unplaceable';
    playerId: string;
    tileId: string;
}

type PublicLogEntry = PublicLogEntryTileUnplaceable;

function allocEngineId(G: GameState, prefix: string): string {
    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}

function appendPublicLog(G: GameState, entry: Omit<PublicLogEntry, 'id'>): void {
    const attrs = G.engine.attributes ?? {};
    const current = Array.isArray(attrs.publicLog) ? (attrs.publicLog as PublicLogEntry[]) : [];
    const next = [...current, { ...entry, id: allocEngineId(G, 'log') }];

    attrs.publicLog = next.slice(Math.max(0, next.length - PUBLIC_LOG_CAP));
    G.engine.attributes = attrs;
}

function ensureStagingZone(G: GameState, playerId: string): string {
    const stagingId = `staging_${playerId}`;
    if (!G.zones[stagingId]) {
        G.zones[stagingId] = { id: stagingId, name: 'Staging', items: [] };
    }
    return stagingId;
}

function hasAnyLegalPlacementIntent(G: GameState, ctx: any, playerId: string): boolean {
    const stageCtx = {
        ...ctx,
        currentPlayer: playerId,
        activePlayers: {
            ...(ctx?.activePlayers || {}),
            [playerId]: 'drawAndPlace'
        }
    };

    const intents = enumerateLegalIntents(G, stageCtx, playerId);
    return intents.some((intent) => intent.moveType === 'placeTile');
}

function markDrawPileEmptyForFinalSettlement(G: GameState): void {
    const attrs = G.engine.attributes ?? {};
    attrs.drawPileEmptyAtTurnStart = true;
    G.engine.attributes = attrs;
}

/**
 * CORE-01-03-02A.1: Fisher-Yates shuffle for draw pile.
 * @usesRNG
 * @rule CORE-01-03-02A
 */
function shuffleDrawPile(G: GameState, ctx: any): void {
    const drawPile = G.zones[CoreZoneName.DrawPile];
    const random = ctx?.random;
    if (!drawPile || !random) return;
    if (typeof random.Die === 'function') {
        const result = [...drawPile.items];
        for (let i = result.length - 1; i >= 1; i--) {
            const j = random.Die(i + 1) - 1;
            [result[i], result[j]] = [result[j], result[i]];
        }
        drawPile.items = result;
        return;
    }
    if (typeof random.Shuffle === 'function') {
        drawPile.items = random.Shuffle([...drawPile.items]);
    }
}

/**
 * CORE-01-04-04: Draw one tile from DrawPile to staging.
 * CORE-01-04-06: If tile cannot be legally placed -> DiscardFaceUp.
 * CORE-01-04-07: After discard due to illegality, draw again (confirm-gated via pendingChoice).
 * @rule CORE-01-04-04
 * @rule CORE-01-04-06
 * @rule CORE-01-04-07
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @sideEffects
 */
export function drawTileToStaging(G: GameState, ctx: any): void {
    if (G.engine.pendingChoice) return;
    const playerId = String(ctx.currentPlayer ?? '0');

    const stagingId = ensureStagingZone(G, playerId);
    const staging = G.zones[stagingId];

    // If already has a tile, don't draw (idempotency).
    if (staging.items.length > 0) return;

    const drawPile = G.zones[CoreZoneName.DrawPile];
    if (!drawPile || drawPile.items.length === 0) {
        markDrawPileEmptyForFinalSettlement(G);
        return;
    }

    // Clear stale flag when we successfully have a pile to draw from.
    if (G.engine.attributes?.drawPileEmptyAtTurnStart) {
        delete G.engine.attributes.drawPileEmptyAtTurnStart;
    }

    const tileId = drawPile.items.shift();
    if (!tileId) {
        markDrawPileEmptyForFinalSettlement(G);
        return;
    }

    staging.items.push(tileId);

    if (hasAnyLegalPlacementIntent(G, ctx, playerId)) return;

    staging.items = staging.items.filter((id) => id !== tileId);
    if (!hasAnyOpenPlacement(G)) {
        const attrs = G.engine.attributes ?? {};
        attrs.noLegalPlacements = true;
        G.engine.attributes = attrs;
        if (G.meta?.cfg?.tileRecycling) {
            drawPile.items.push(tileId);
            shuffleDrawPile(G, ctx);
        } else {
            const discardZone = G.zones[CoreZoneName.DiscardFaceUp];
            discardZone.items.push(tileId);
        }
        return;
    }

    if (G.meta?.cfg?.tileRecycling) {
        drawPile.items.push(tileId);
        shuffleDrawPile(G, ctx);
    } else {
        const discardZone = G.zones[CoreZoneName.DiscardFaceUp];
        discardZone.items.push(tileId);
    }

    if (drawPile.items.length === 0) {
        markDrawPileEmptyForFinalSettlement(G);
    }

    appendPublicLog(G, {
        kind: 'tile.unplaceable',
        playerId,
        tileId
    });

    const choiceId = allocEngineId(G, 'choice');
    G.engine.pendingChoice = {
        choiceId,
        sourceId: UNPLACEABLE_DRAW_CHOICE_SOURCE_ID,
        player: playerId,
        kind: 'selectOption',
        spec: { options: ['OK'] },
        resumeToken: choiceId
    };
}
