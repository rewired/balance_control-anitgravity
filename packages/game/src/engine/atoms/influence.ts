import { CoreZoneName } from '@balance-control/rules';
import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';
import { countPlayerInfluence, getInfluenceCap } from '../../mechanics-turn';
import { allocId } from '../resolver/ids';
import { applyModifiers } from '../resolver/modifiers';

function handleInfluencePlace(G: GameState & { engine: EngineState }, atom: any): void {
    applyModifiers(G, null, 'beforeAction', atom);
    const { playerId, targetTileId } = atom;
    const supplyId = `${CoreZoneName.PersonalSupply}:${playerId}`;
    const supply = G.zones[supplyId];
    const targetZone = G.zones[targetTileId];

    const idx = supply.items.findIndex(id => G.objects[id]?.type === 'Influence');
    if (idx >= 0) {
        const iid = supply.items.splice(idx, 1)[0];
        targetZone.items.push(iid);
    }
}

function handleInfluenceFormalize(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
    applyModifiers(G, null, 'beforeAction', atom);
    const { playerId } = atom;
    if (countPlayerInfluence(G, playerId) >= getInfluenceCap(ctx)) {
        return;
    }

    const supplyId = `PersonalSupply:${playerId}`;
    const supply = G.zones[supplyId];

    // CORE-01-04-17: Create exactly one new Influence
    const infId = allocId(G as any, `inf_${playerId}_form`);
    G.objects[infId] = { id: infId, type: 'Influence', owner: playerId };
    supply.items.push(infId);
}

function handleInfluenceMove(G: GameState & { engine: EngineState }, atom: any): boolean {
    applyModifiers(G, null, 'beforeAction', atom);
    const { playerId, sourceTileId, targetTileId } = atom;
    const srcZone = G.zones[sourceTileId];
    const dstZone = G.zones[targetTileId];
    if (!srcZone || !dstZone) return false;

    const idx = srcZone.items.findIndex(id => G.objects[id]?.owner === playerId && G.objects[id].type === 'Influence');
    if (idx < 0) return false;

    const iid = srcZone.items.splice(idx, 1)[0];
    dstZone.items.push(iid);
    return true;
}

export const coreInfluenceAtoms: AtomRegistration[] = [
    { kind: 'influence.place', handler: (G, _ctx, atom) => handleInfluencePlace(G as any, atom) },
    { kind: 'influence.formalize', handler: (G, ctx, atom) => handleInfluenceFormalize(G as any, ctx, atom) },
    { kind: 'influence.move', handler: (G, _ctx, atom) => handleInfluenceMove(G as any, atom) }
];

