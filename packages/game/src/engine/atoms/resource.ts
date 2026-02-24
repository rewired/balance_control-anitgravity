import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';
import { computeMajority } from '../../mechanics';
import { allocId } from '../resolver/ids';
import { commitCost, type CostSlot, validateCost } from '../resolver/costs';

function handleResourcePenaltyToNoise(G: GameState & { engine: EngineState }, atom: any): boolean {
    // CORE-01-04-12B: Move chosen resources from PersonalSupply to Noise
    const { playerId, resourceIds } = atom;
    const supplyId = `PersonalSupply:${playerId}`;
    const supply = G.zones[supplyId];
    const noise = G.zones['Noise'];
    if (!supply || !noise) return false;

    for (const rid of resourceIds) {
        const idx = supply.items.indexOf(rid);
        if (idx < 0) return false;
        const obj = G.objects[rid];
        if (!obj || obj.type !== 'Resource') return false;
        supply.items.splice(idx, 1);
        noise.items.push(rid);
        obj.owner = undefined;
    }
    return true;
}

function handleResourcePay(G: GameState & { engine: EngineState }, atom: any): boolean {
    const { playerId, amount, resorts } = atom;
    let resolvedPlayerId = playerId;

    if (resolvedPlayerId === 'CONTROLLER') {
        const contextTileId = atom.context?.tileId;
        if (!contextTileId) return false;
        const { controller } = computeMajority(contextTileId, G);
        if (!controller) return false;
        resolvedPlayerId = controller;
    }

    const slots: CostSlot[] = Array.from({ length: Math.max(0, amount) }, () => (
        resorts === 'ANY' ? 'ANY' : [...resorts]
    ));

    const validation = validateCost(G, null, {
        playerId: resolvedPlayerId,
        slots,
        resourceIds: atom.resourceIds,
        allowSubstitutions: !atom.resourceIds
    });

    if (!validation.ok) {
        console.error(`[resolver:resource.pay] ${validation.error}`);
        return false;
    }

    return commitCost(G, null, {
        playerId: resolvedPlayerId,
        slots,
        resourceIds: validation.resourceIds
    });
}

/**
 * Grants resources to a player.
 * @rule CORE-01-00-04A
 */
function handleResourceGrant(G: GameState, atom: any): void {
    let { playerId, amount, resort, context, missingController } = atom;

    if (amount === 'CONTEXT_BASE' && context?.baseAmount !== undefined) {
        amount = context.baseAmount;
    }
    if (resort === 'CONTEXT_RESORT' && context?.resort) {
        resort = context.resort;
    }

    if (playerId === 'CONTROLLER') {
        const controller = context?.tileId ? computeMajority(context.tileId, G).controller : null;

        if (controller) {
            playerId = controller;
        } else {
            const policy = missingController ?? 'ERROR';
            if (policy === 'NOISE') {
                playerId = 'NOISE';
            } else if (policy === 'SKIP') {
                return;
            } else {
                const sourceTag = context?.source || context?.tileId || atom.reason || 'unknown';
                throw new Error(`[resolver:resource.grant] missing controller for "${sourceTag}"`);
            }
        }
    }

    const supplyId = playerId === 'NOISE' ? 'Noise' : `PersonalSupply:${playerId}`;
    const targetZone = G.zones[supplyId];
    const bank = G.zones['Bank'];

    if (!targetZone || !bank) return;

    if (amount >= 0) {
        for (let k = 0; k < amount; k++) {
            const bankIdx = bank.items.findIndex(id => G.objects[id]?.resort === resort);
            if (bankIdx >= 0) {
                const rid = bank.items.splice(bankIdx, 1)[0];
                targetZone.items.push(rid);
                if (G.objects[rid]) G.objects[rid].owner = playerId === 'NOISE' ? undefined : playerId;
            } else {
                const rid = allocId(G as any, `res_${resort}`);
                G.objects[rid] = { id: rid, type: 'Resource', owner: playerId === 'NOISE' ? undefined : playerId, resort };
                targetZone.items.push(rid);
            }
        }
    } else {
        // Negative grant = Removal (Reduction)
        const countToRemove = Math.abs(amount);
        let removed = 0;
        for (let i = targetZone.items.length - 1; i >= 0 && removed < countToRemove; i--) {
            const rid = targetZone.items[i];
            const obj = G.objects[rid];
            if (obj && obj.type === 'Resource' && obj.resort === resort) {
                targetZone.items.splice(i, 1);
                bank.items.push(rid);
                obj.owner = undefined;
                removed++;
            }
        }
    }
}

export const coreResourceAtoms: AtomRegistration[] = [
    { kind: 'resource.pay', handler: (G, _ctx, atom) => handleResourcePay(G as any, atom) },
    { kind: 'resource.penaltyToNoise', handler: (G, _ctx, atom) => handleResourcePenaltyToNoise(G as any, atom) },
    { kind: 'resource.grant', handler: (G, _ctx, atom) => handleResourceGrant(G as any, atom) }
];

