import type { GameState } from '@balance-control/rules';
import {
    type AtomRegistration,
    type EngineState,
    EnginePackRegistry,
    applyModifiers,
    isProhibited,
} from '@balance-control/game';
import { computeMajority } from '../../mechanics';

/**
 * Processes production resolution for a single resort tile.
 * @rule CORE-01-06-16
 * @rule CORE-01-06-09
 * @rule CORE-01-06-10
 * @rule CORE-01-06-11
 * @rule CORE-01-06-12
 * @rule CORE-01-06-13
 * @rule CORE-01-06-13A
 * @rule CORE-01-06-14
 * @rule CORE-01-06-15
 * @rule CORE-01-06-16-00
 * @rule CORE-01-06-17
 * @deterministic
 * @sideEffects
 */
function handleProductionResolve(G: GameState & { engine: EngineState }, atom: any): void {
    const { tileId } = atom;
    const tile = G.tiles[tileId];
    if (!tile || tile.type !== 'Resort' || !tile.resort) return;

    // CORE-01-06-17
    if (isProhibited(G, 'production.resolve', 'NONE', tileId)) return;

    const printedAmount = tile.weight || 0;
    const baseAmount = EnginePackRegistry.applyProductionModifiers(G, tileId, printedAmount);
    atom.context = { ...atom.context, tileId, baseAmount, resort: tile.resort };

    // 1. Trigger hooks that might add or subtract from this distribution
    applyModifiers(G, null, 'onProduction', atom);

    // CORE-01-06-16: Tie split is even; remainder goes to Noise.
    const majority = computeMajority(tileId, G);
    const grants: Array<{ playerId: string; amount: number }> = [];

    if (majority.controller) {
        const cap = G.engine.attributes[`productionCap:${majority.controller}`];
        let finalAmount = baseAmount;
        // CORE-01-06-16(a): Apply production cap if set
        if (cap !== undefined) {
            finalAmount = Math.min(finalAmount, cap);
        }
        if (finalAmount > 0) {
            grants.push({ playerId: majority.controller, amount: finalAmount });
        }
    } else if (majority.winners.length > 0 && baseAmount > 0) {
        const winners = [...majority.winners].sort();
        const splitAmount = Math.floor(baseAmount / winners.length);
        const remainder = baseAmount % winners.length;

        if (splitAmount > 0) {
            for (const winner of winners) {
                grants.push({ playerId: winner, amount: splitAmount });
            }
        }

        if (remainder > 0) {
            grants.push({ playerId: 'NOISE', amount: remainder });
        }
    }

    for (let i = grants.length - 1; i >= 0; i--) {
        const grant = grants[i];
        G.engine.effectQueue.unshift({
            kind: 'resource.grant',
            playerId: grant.playerId as any,
            amount: grant.amount,
            resort: tile.resort,
            context: { tileId, source: 'production', baseAmount }
        });
    }
}

export const coreProductionAtoms: AtomRegistration[] = [
    { kind: 'production.resolve', handler: (G, _ctx, atom) => handleProductionResolve(G as any, atom) }
];
