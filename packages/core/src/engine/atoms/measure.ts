import type { GameState } from '@balance-control/rules';
import {
    type AtomRegistration,
    type EngineState,
    EnginePackRegistry,
    lookupMeasureDeckForObjectId,
} from '@balance-control/game';

/**
 * Executes the play of a measure.
 * @expansion EXP-01-00
 * @deterministic
 * @sideEffects
 * @rule EXP-01-07
 */
function handleMeasurePlay(G: GameState & { engine: EngineState }, atom: any): void {
    const { playerId, measureObjectId } = atom;
    const obj = G.objects[measureObjectId];
    if (!obj || obj.type !== 'Measure') return;

    const mId = obj.measureId;
    if (!mId) return;

    const deck = lookupMeasureDeckForObjectId(G, measureObjectId);
    const atoms = EnginePackRegistry.getMeasureAtomsForExpansion(G, deck.expansionId, mId, atom);

    if (atoms && atoms.length > 0) {
        G.engine.effectQueue.unshift(...atoms);
    } else {
        throw new Error(`Engine: measure "${mId}" not defined in expansion "${deck.expansionId}".`);
    }

    // Standard Recycle and Hand Removal
    const handId = `PlayerHand:${playerId}`;
    const hand = G.zones[handId];
    if (hand) {
        const idx = hand.items.indexOf(measureObjectId);
        if (idx >= 0) hand.items.splice(idx, 1);
    }

    obj.playCount = (obj.playCount || 0) + 1;
    obj.owner = undefined;

    const targetZone = obj.playCount === 1 ? deck.recyclePileId : deck.finalDiscardId;
    if (G.zones[targetZone]) {
        G.zones[targetZone].items.push(measureObjectId);
    }
}

/**
 * Shuffles the recycle pile into the draw pile when needed.
 * @expansion EXP-01-00
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @sideEffects
 * @rule EXP-01-07-05
 */
function handleMeasureRecycle(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
    const { drawPileId, recyclePileId } = atom;
    const drawPile = G.zones[drawPileId];
    const recyclePile = G.zones[recyclePileId];

    if (drawPile && recyclePile && recyclePile.items.length > 0) {
        drawPile.items = ctx.random.Shuffle([...recyclePile.items]);
        recyclePile.items = [];
    }
}

/**
 * Handles taking a measure from the open display.
 * @expansion EXP-01-00
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @sideEffects
 * @rule EXP-01-06
 */
function handleMeasureTake(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
    const { playerId, measureObjectId } = atom;
    const obj = G.objects[measureObjectId];
    if (!obj || obj.type !== 'Measure') return;

    const deck = lookupMeasureDeckForObjectId(G, measureObjectId);

    const openZone = G.zones[deck.openZoneId];
    const hand = G.zones[`PlayerHand:${playerId}`];
    if (!openZone || !hand) return;

    const idx = openZone.items.indexOf(measureObjectId);
    if (idx >= 0) {
        openZone.items.splice(idx, 1);
        hand.items.push(measureObjectId);
        obj.owner = playerId;

        // Refill logic
        const drawPile = G.zones[deck.drawPileId];
        if (drawPile && drawPile.items.length > 0) {
            openZone.items.push(drawPile.items.pop()!);
        } else {
            // Trigger recycle
            handleMeasureRecycle(G, ctx, { kind: 'measure.recycle', drawPileId: deck.drawPileId, recyclePileId: deck.recyclePileId });
            if (drawPile && drawPile.items.length > 0) {
                openZone.items.push(drawPile.items.pop()!);
            }
        }
    }
}

/**
 * Atom registrations for measure lifecycle (EXP-01-00).
 * @expansion EXP-01-00
 * @requires CORE-01-00
 * @deterministic
 * @rule EXP-01-07
 */
export const coreMeasureAtoms: AtomRegistration[] = [
    { kind: 'measure.play', handler: (G, _ctx, atom) => handleMeasurePlay(G as any, atom) },
    { kind: 'measure.take', handler: (G, ctx, atom) => handleMeasureTake(G as any, ctx, atom) },
    { kind: 'measure.recycle', handler: (G, ctx, atom) => handleMeasureRecycle(G as any, ctx, atom) }
];
