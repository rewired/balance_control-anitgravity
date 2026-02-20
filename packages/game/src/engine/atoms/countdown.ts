import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';

/**
 * Handles the placement of a countdown marker.
 * @expansion EXP-03-00
 * @deterministic
 * @sideEffects
 * @rule EXP-03-04-B
 */
function handleCountdownPlace(G: GameState & { engine: EngineState }, atom: any): void {
    const { targetTileId, amount = 3 } = atom;
    const supply = G.zones.CountdownSupply;
    if (!supply || supply.items.length === 0) return;

    const cid = supply.items.pop()!;
    const obj = G.objects[cid];
    if (obj) {
        obj.targetTileId = targetTileId;
        (obj as any).amount = amount;
    }

    const targetZone = G.zones[targetTileId];
    if (targetZone) {
        targetZone.items.push(cid);
    }
}

/**
 * Atom registrations for Countdown markers (EXP-03-00).
 * @expansion EXP-03-00
 * @requires CORE-01-00
 * @deterministic
 * @rule EXP-03-04-B
 */
export const exp03CountdownAtoms: AtomRegistration[] = [
    { kind: 'countdown.place', handler: (G, _ctx, atom) => handleCountdownPlace(G as any, atom) }
];
