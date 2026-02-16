import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';

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

export const exp03CountdownAtoms: AtomRegistration[] = [
    { kind: 'countdown.place', handler: (G, _ctx, atom) => handleCountdownPlace(G as any, atom) }
];

