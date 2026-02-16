import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';
import { allocId } from '../resolver/ids';

function handleRegulationPlace(G: GameState & { engine: EngineState }, atom: any): void {
    const { regType, targetTileId } = atom;
    const supply = G.zones.RegulationSupply;
    const attached = G.zones.BoardAttached;
    if (!supply || !attached) return;

    let regId = supply.items.find(id => G.objects[id].regType === regType);
    if (!regId) {
        regId = allocId(G as any, `reg_${regType}_gen`);
        G.objects[regId] = { id: regId, type: 'Regulation', regType };
    } else {
        supply.items.splice(supply.items.indexOf(regId), 1);
    }
    attached.items.push(regId);
    G.objects[regId].targetTileId = targetTileId;
}

function handleRegulationMove(G: GameState & { engine: EngineState }, atom: any): void {
    const { regulationId, targetTileId } = atom;
    const obj = G.objects[regulationId];
    if (!obj || obj.type !== 'Regulation') return;

    // Check M13 protection
    const protectedTiles = G.engine.attributes.protectedTiles || [];
    if (protectedTiles.includes(obj.targetTileId)) return;

    obj.targetTileId = targetTileId;
}

function handleRegulationRemove(G: GameState & { engine: EngineState }, atom: any): void {
    const { regulationId } = atom;
    const obj = G.objects[regulationId];
    if (!obj || obj.type !== 'Regulation') return;

    // Check M13 protection
    const protectedTiles = G.engine.attributes.protectedTiles || [];
    if (protectedTiles.includes(obj.targetTileId)) return;

    const attached = G.zones.BoardAttached;
    const supply = G.zones.RegulationSupply;
    if (!attached || !supply) return;

    const idx = attached.items.indexOf(regulationId);
    if (idx >= 0) {
        attached.items.splice(idx, 1);
    }
}

export const exp02RegulationAtoms: AtomRegistration[] = [
    { kind: 'regulation.place', handler: (G, _ctx, atom) => handleRegulationPlace(G as any, atom) },
    { kind: 'regulation.move', handler: (G, _ctx, atom) => handleRegulationMove(G as any, atom) },
    { kind: 'regulation.remove', handler: (G, _ctx, atom) => handleRegulationRemove(G as any, atom) }
];

