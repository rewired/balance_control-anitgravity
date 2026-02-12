import { GameState, TileType, GameObject, CoreZoneNames, ResourceType } from '@balance-control/rules';
import { ExpansionRegistry } from './expansion-registry';

export interface MajorityResult {
    controller: string | null;
    winners: string[];
}

export function computeMajority(tileId: string, G: GameState, visited: Set<string> = new Set()): MajorityResult {
    // CORE-01-08-05: Start Committee cannot be controlled
    const tile = G.tiles[tileId];
    if (tile && tile.type === TileType.StartCommittee) {
        return { controller: null, winners: [] };
    }

    if (visited.has(tileId)) {
        return { controller: null, winners: [] };
    }
    visited.add(tileId);

    const tileZone = G.zones[tileId];
    if (!tileZone) return { controller: null, winners: [] };

    const influenceCounts: Record<string, number> = {};

    for (const itemId of tileZone.items) {
        const obj = G.objects[itemId];
        if (obj && obj.type === 'Influence' && obj.owner) {
            influenceCounts[obj.owner] = (influenceCounts[obj.owner] || 0) + 1;
        }
    }

    // CORE-01-05-04: Lobbyist adjacency bonus
    const neighbors = G.adjacency[tileId] || [];
    for (const nId of neighbors) {
        const neighborTile = G.tiles[nId];
        if (neighborTile && neighborTile.type === TileType.Lobbyist) {
            const { controller } = computeMajority(nId, G, new Set(visited));
            if (controller) {
                influenceCounts[controller] = (influenceCounts[controller] || 0) + 1;
            }
        }
    }

    let max = 0;
    let winners: string[] = [];

    for (const [player, count] of Object.entries(influenceCounts)) {
        if (count > max) {
            max = count;
            winners = [player];
        } else if (count === max) {
            winners.push(player);
        }
    }

    if (winners.length === 1) {
        return { controller: winners[0], winners };
    }

    return { controller: null, winners: winners };
}

/** 
 * EXP-02 Regulation Evaluation
 * Order: 1. Blockade, 2. Cost (Control/Admin), 3. Output (SecurityLevel)
 */
export function getRegulationModifiers(tileId: string, G: GameState) {
    const attachedRegs = G.zones[CoreZoneNames.BoardAttached]?.items || [];
    const regsOnTile = attachedRegs.filter(rid => G.objects[rid]?.targetTileId === tileId);

    const modifiers = {
        isBlockaded: false,
        extraCost: 0,
        outputReduction: 0
    };

    regsOnTile.forEach(rid => {
        const reg = G.objects[rid];
        if (!reg) return;

        switch (reg.regType) {
            case 'Blockade':
                modifiers.isBlockaded = true;
                break;
            case 'Control':
            case 'Administration':
                modifiers.extraCost += 1;
                break;
            case 'SecurityLevel':
                modifiers.outputReduction += 1;
                break;
        }
    });

    return modifiers;
}

export function resolveEffect(G: GameState, ctx: any, effect: any, contextTileId?: string) {
    // CORE-01-08-06: Start Committee is immune to all effects
    if (contextTileId) {
        const contextTile = G.tiles[contextTileId];
        if (contextTile && contextTile.type === TileType.StartCommittee) {
            // Exception: FORMALIZE is performed VIA the Start Committee, not ON it
            if (effect.type !== 'FORMALIZE') {
                return; // Immune
            }
        }
    }

    switch (effect.type) {
        case 'PLACE_INFLUENCE':
        case 'MOVE_INFLUENCE':
        case 'FORMALIZE':
        case 'CONVERT':
        case 'HOTSPOT_RESOLUTION': {
            // EXP-02-04-B-01: Evaluate Blockade first
            if (contextTileId) {
                const regs = getRegulationModifiers(contextTileId, G);
                if (regs.isBlockaded) return; // Blocked
            }
            break;
        }
    }

    switch (effect.type) {
        case 'PLACE_INFLUENCE': {
            const { playerId, targetTileId } = effect.payload;
            const supplyId = `${CoreZoneNames.PersonalSupply}:${playerId}`;
            const supplyZone = G.zones[supplyId];
            const targetZone = G.zones[targetTileId];

            if (!supplyZone || !targetZone) return;

            const infIndex = supplyZone.items.findIndex(id => G.objects[id] && G.objects[id].type === 'Influence');

            if (infIndex >= 0) {
                const objId = supplyZone.items[infIndex];
                supplyZone.items.splice(infIndex, 1);
                targetZone.items.push(objId);
            }
            break;
        }
        case 'MOVE_INFLUENCE': {
            const { sourceTileId, targetTileId: tgtId } = effect.payload;
            const srcZone = G.zones[sourceTileId];
            const dstZone = G.zones[tgtId];
            const pid = ctx.currentPlayer;
            const idx = srcZone.items.findIndex((id: string) => G.objects[id]?.owner === pid && G.objects[id].type === 'Influence');
            if (idx >= 0) {
                const oid = srcZone.items[idx];
                srcZone.items.splice(idx, 1);
                dstZone.items.push(oid);
            }
            break;
        }
        case 'FORMALIZE': {
            const { playerId, resourceIds, payForInfluenceResourceId } = effect.payload;
            const supplyId = `${CoreZoneNames.PersonalSupply}:${playerId}`;
            const supplyZone = G.zones[supplyId];
            const bankZone = G.zones[CoreZoneNames.Bank];

            // EXP-03-08-M05 Greenwashing influence suppression
            let canGenerate = true;
            if (G.secret?.exp03?.noInfluenceUntilNextTurn) {
                canGenerate = false;
                if (payForInfluenceResourceId) {
                    const obj = G.objects[payForInfluenceResourceId];
                    if (obj && (obj.resort === 'CLM' || obj.resort === 'INF') && supplyZone.items.includes(payForInfluenceResourceId)) {
                        // Pay and generate
                        const idx = supplyZone.items.indexOf(payForInfluenceResourceId);
                        supplyZone.items.splice(idx, 1);
                        bankZone.items.push(payForInfluenceResourceId);
                        obj.owner = undefined;
                        canGenerate = true;
                    }
                }
            }

            // CORE-01-04-16: Move paid Resources to Bank
            for (const rid of resourceIds) {
                const idx = supplyZone.items.indexOf(rid);
                if (idx >= 0) {
                    supplyZone.items.splice(idx, 1);
                    bankZone.items.push(rid);
                    if (G.objects[rid]) G.objects[rid].owner = undefined;
                }
            }

            // CORE-01-04-17: Create exactly one new Influence
            if (canGenerate) {
                const infId = `inf_${playerId}_form_${Date.now()}`;
                const infObj: GameObject = { id: infId, type: 'Influence', owner: playerId };
                G.objects[infId] = infObj;
                supplyZone.items.push(infId);
            }
            break;
        }
        case 'HOTSPOT_RESOLUTION': {
            if (!contextTileId) return;

            // EXP-01-08-M01-05: Prohibited hotspots
            if (G.secret?.prohibitedHotspots?.includes(contextTileId)) return;

            // EXP-03-08-M07: Protest Movement - Majority no Influence
            if (G.secret?.exp03?.noMajorityInfluenceUntilNextTurn) return;

            // CORE-01-06-04: Determine majority
            const { controller } = computeMajority(contextTileId, G);

            if (controller) {
                const supplyId = `${CoreZoneNames.PersonalSupply}:${controller}`;
                const supplyZone = G.zones[supplyId];
                const targetZone = G.zones[contextTileId];

                if (!supplyZone || !targetZone) return;

                // EXP-03-08-M05 Greenwashing integration for majority placement
                let canGenerate = true;
                if (G.secret?.exp03?.noInfluenceUntilNextTurn) {
                    // Note: Hotspot resolution majority placement is triggered by tile placement.
                    // Spec says "Affected player MAY pay". This implies a choice.
                    // Deterministic engine choice: If they have CLM or INF, they pay it?
                    // Better: The move triggering this should provide the optional payment ID.
                    const payId = effect.payload.payForInfluenceResourceId;
                    if (payId) {
                        const obj = G.objects[payId];
                        if (obj && (obj.resort === 'CLM' || obj.resort === 'INF') && supplyZone.items.includes(payId)) {
                            const idx = supplyZone.items.indexOf(payId);
                            supplyZone.items.splice(idx, 1);
                            G.zones[CoreZoneNames.Bank].items.push(payId);
                            obj.owner = undefined;
                            canGenerate = true;
                        } else {
                            canGenerate = false;
                        }
                    } else {
                        canGenerate = false;
                    }
                }

                if (canGenerate) {
                    // CORE-01-06-05/06: Place one Influence from supply to Hotspot
                    const infIndex = supplyZone.items.findIndex((id: string) => G.objects[id] && G.objects[id].type === 'Influence');
                    if (infIndex >= 0) {
                        const objId = supplyZone.items[infIndex];
                        supplyZone.items.splice(infIndex, 1);
                        targetZone.items.push(objId);
                    }
                }
            }
            break;
        }
    }

    // Call Expansion Handlers (EXP-01 Support)
    ExpansionRegistry.applyEffect(G, ctx, effect, contextTileId, {
        grantResources,
        computeMajority
    });
}

// CORE-01-06-09–16: Resort Production
export function resolveProduction(tileId: string, G: GameState) {
    const tile = G.tiles[tileId];
    // CORE-01-06-08: Hotspots do not produce Resources
    if (!tile || tile.type !== TileType.Resort || !tile.resort || !tile.weight) return;

    // CORE-01-06-16(a): Start with printed production value
    let amount = tile.weight;

    // EXP-03-10-04: Resolution Order
    // 1. Apply EXP-01 (Doubling)
    const expansions = ExpansionRegistry.getAll();
    const exp01 = expansions.find(e => e.name.includes('EXP-01'));
    if (exp01?.modifiers?.production) {
        amount = exp01.modifiers.production(tileId, G, amount);
    }

    // 2. Climate Modifications (EXP-03)
    const exp03 = expansions.find(e => e.name.includes('EXP-03'));
    if (exp03?.modifiers?.production) {
        amount = exp03.modifiers.production(tileId, G, amount);
    }

    // 3. Overlay reductions (EXP-02 Regulations)
    const regs = getRegulationModifiers(tileId, G);
    if (regs.isBlockaded) return;
    amount -= regs.outputReduction;

    // Handle any other expansion modifiers not explicitly ordered
    expansions.forEach(exp => {
        if (exp !== exp01 && exp !== exp03 && exp.modifiers?.production) {
            amount = exp.modifiers.production(tileId, G, amount);
        }
    });

    // CORE-01-06-16(a4): Floor at 0
    if (amount < 0) amount = 0;

    // CORE-01-06-16(b): Determine control
    const { controller, winners } = computeMajority(tileId, G);

    // CORE-01-06-16(c): Distribute
    if (controller) {
        // CORE-01-06-11: Controller gets full amount
        let finalAmount = amount;
        if (G.secret?.exp03?.productionCaps?.[controller] !== undefined) {
            finalAmount = Math.min(finalAmount, G.secret.exp03.productionCaps[controller]);
        }
        grantResources(G, controller, tile.resort, finalAmount);
    } else if (winners.length > 0) {
        // CORE-01-06-14/15: Tie splits evenly, remainder to Noise
        const splitAmount = Math.floor(amount / winners.length);
        const remainder = amount % winners.length;
        winners.forEach(p => {
            let finalSplit = splitAmount;
            if (G.secret?.exp03?.productionCaps?.[p] !== undefined) {
                finalSplit = Math.min(finalSplit, G.secret.exp03.productionCaps[p]);
            }
            grantResources(G, p, tile.resort!, finalSplit);
        });
        if (remainder > 0) {
            grantResources(G, 'NOISE', tile.resort!, remainder);
        }
    }
    // CORE-01-06-13: No controller + no ties → no resources (implicit)
}

// CORE-01-06-12: Resources moved from Bank to player
// If Bank doesn't have matching resources, create them (resource tokens are fungible)
export function grantResources(G: GameState, owner: string, resort: ResourceType, amount: number) {
    if (amount <= 0) return;

    let targetZoneId: string;
    if (owner === 'NOISE') {
        targetZoneId = CoreZoneNames.Noise;
    } else {
        targetZoneId = `${CoreZoneNames.PersonalSupply}:${owner}`;
    }

    const bankZone = G.zones[CoreZoneNames.Bank];

    for (let k = 0; k < amount; k++) {
        // Try to pull matching resource from Bank first (CORE-01-06-12)
        const bankIdx = bankZone ? bankZone.items.findIndex(
            (id: string) => G.objects[id]?.type === 'Resource' && G.objects[id]?.resort === resort
        ) : -1;

        if (bankIdx >= 0) {
            const rid = bankZone.items[bankIdx];
            bankZone.items.splice(bankIdx, 1);
            if (G.objects[rid]) {
                G.objects[rid].owner = owner === 'NOISE' ? undefined : owner;
            }
            G.zones[targetZoneId].items.push(rid);
        } else {
            // Bank empty for this resort → create new token (fungible)
            const rid = `res_${resort}_${Date.now()}_${Math.random()}`;
            const resObj: GameObject = { id: rid, type: 'Resource', owner: owner === 'NOISE' ? undefined : owner, resort };
            G.objects[rid] = resObj;
            G.zones[targetZoneId].items.push(rid);
        }
    }
}
