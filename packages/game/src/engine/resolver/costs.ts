import type { GameState } from '@balance-control/rules';
import type { EngineState } from '../types';
import { findObjectZoneId, getPlayerMetaMarker } from '../../state-lookup';

export type CostSlot = string[] | 'ANY';

export interface CostSpec {
    playerId: string;
    slots: CostSlot[];
    resourceIds?: string[];
    allowSubstitutions?: boolean;
}

export type CostValidationResult =
    | { ok: true; resourceIds: string[] }
    | { ok: false; error: string };

export function validateCost(
    G: GameState & { engine: EngineState },
    _ctx: any,
    costSpec: CostSpec
): CostValidationResult {
    const { playerId, slots, resourceIds, allowSubstitutions = false } = costSpec;
    if (slots.length === 0) {
        return { ok: true, resourceIds: [] };
    }

    const supplyId = `PersonalSupply:${playerId}`;
    const supply = G.zones[supplyId];
    const bank = G.zones['Bank'];
    if (!supply || !bank) {
        return { ok: false, error: 'missing supply or bank zone' };
    }

    if (resourceIds && resourceIds.length < slots.length) {
        return { ok: false, error: 'not enough resource ids provided' };
    }

    const usedSubstitution = { eco: false, sec: false };
    const selectedResourceIds: string[] = [];
    const usedResourceIds = new Set<string>();

    const canUseResource = (
        rid: string,
        slot: CostSlot
    ):
        | { ok: true; useEcoSubstitution: boolean; useSecSubstitution: boolean }
        | { ok: false } => {
        if (usedResourceIds.has(rid)) return { ok: false };
        if (!supply.items.includes(rid)) return { ok: false };

        const obj = G.objects[rid];
        if (!obj || obj.type !== 'Resource') return { ok: false };

        const normalizedSlot: CostSlot = slot === 'ANY' || slot.includes('ANY') ? 'ANY' : slot;
        if (normalizedSlot === 'ANY' || normalizedSlot.includes(obj.resort!)) {
            return { ok: true, useEcoSubstitution: false, useSecSubstitution: false };
        }

        if (!allowSubstitutions) {
            return { ok: false };
        }

        if (
            normalizedSlot.includes('ECO')
            && !usedSubstitution.eco
            && G.engine.attributes[`ecoSubstitute:${playerId}`]
        ) {
            return { ok: true, useEcoSubstitution: true, useSecSubstitution: false };
        }

        if (
            obj.resort === 'SEC'
            && !usedSubstitution.sec
            && G.engine.attributes[`secSubstitution:${playerId}`]
        ) {
            return { ok: true, useEcoSubstitution: false, useSecSubstitution: true };
        }

        return { ok: false };
    };

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
        const slot = slots[slotIdx];

        if (resourceIds) {
            const rid = resourceIds[slotIdx];
            if (!rid) {
                return { ok: false, error: 'missing explicit resource id for cost slot' };
            }

            const check = canUseResource(rid, slot);
            if (!check.ok) {
                return { ok: false, error: `invalid explicit payment resource "${rid}"` };
            }

            if (check.useEcoSubstitution) usedSubstitution.eco = true;
            if (check.useSecSubstitution) usedSubstitution.sec = true;
            usedResourceIds.add(rid);
            selectedResourceIds.push(rid);
            continue;
        }

        let selectedId: string | undefined;
        let selectedCheck: { ok: true; useEcoSubstitution: boolean; useSecSubstitution: boolean } | undefined;

        for (let i = supply.items.length - 1; i >= 0; i--) {
            const rid = supply.items[i];
            const check = canUseResource(rid, slot);
            if (check.ok) {
                selectedId = rid;
                selectedCheck = check;
                break;
            }
        }

        if (!selectedId || !selectedCheck) {
            return { ok: false, error: 'insufficient resources for cost' };
        }

        if (selectedCheck.useEcoSubstitution) usedSubstitution.eco = true;
        if (selectedCheck.useSecSubstitution) usedSubstitution.sec = true;
        usedResourceIds.add(selectedId);
        selectedResourceIds.push(selectedId);
    }

    return { ok: true, resourceIds: selectedResourceIds };
}

export function commitCost(
    G: GameState & { engine: EngineState },
    _ctx: any,
    costSpec: CostSpec & { resourceIds: string[] }
): boolean {
    const { playerId, resourceIds } = costSpec;
    if (resourceIds.length === 0) return true;

    const supplyId = `PersonalSupply:${playerId}`;
    const supply = G.zones[supplyId];
    const bank = G.zones['Bank'];
    if (!supply || !bank) return false;

    for (const rid of resourceIds) {
        if (!supply.items.includes(rid)) return false;
        const obj = G.objects[rid];
        if (!obj || obj.type !== 'Resource') return false;
    }

    for (const rid of resourceIds) {
        const idx = supply.items.indexOf(rid);
        if (idx < 0) return false;
        supply.items.splice(idx, 1);
        bank.items.push(rid);
        G.objects[rid].owner = undefined;
    }

    return true;
}

export function getExtraCostSlots(
    G: GameState & { engine: EngineState },
    pid: string,
    actionType: string,
    tileId?: string
): CostSlot[] {
    const attr = G.engine.attributes;
    const costSlots: CostSlot[] = [];

    if (tileId && attr.tileExtraCosts?.[tileId]) {
        for (let i = 0; i < attr.tileExtraCosts[tileId]; i++) costSlots.push('ANY');
    }

    if (attr.playerExtraCosts?.[pid]) {
        for (let i = 0; i < attr.playerExtraCosts[pid]; i++) costSlots.push('ANY');
    }

    if (attr.climateCostRules) {
        const isImmune = attr[`climateImmunity:${pid}`] || attr[`ignoreClimateCosts:${pid}`] || attr.ignoreClimateCostThisAction;
        if (!isImmune) {
            for (const rule of attr.climateCostRules) {
                let apply = false;
                if (rule.type === 'action' && rule.target === actionType) apply = true;
                if (rule.type === 'tile' && rule.target === tileId) apply = true;
                if (rule.type === 'resort' && tileId && G.tiles[tileId]?.resort === rule.target) apply = true;

                if (apply) {
                    for (let i = 0; i < rule.amount; i++) costSlots.push(rule.resorts || 'ANY');
                }
            }
        }
    }

    if (actionType === 'convertResources') {
        const marker = getPlayerMetaMarker(G, pid);
        if (marker && marker.mode === 'Convert') {
            const markerZoneId = findObjectZoneId(G, marker.id);
            const supplyId = `PersonalSupply:${pid}`;
            if (markerZoneId && markerZoneId !== supplyId && G.tiles[markerZoneId]) {
                costSlots.push('ANY');
            }
        }
    }

    // CORE-01-04-12B: Ping-Pong Penalty — N = min(10, floor(R/2)) resources to Noise
    if (actionType === 'influence.move' && tileId) {
        const marker = getPlayerMetaMarker(G, pid);
        if (marker && marker.mode === 'PingPong') {
            const markerZoneId = findObjectZoneId(G, marker.id);
            if (markerZoneId === tileId) {
                const supplyId = `PersonalSupply:${pid}`;
                const supply = G.zones[supplyId];
                const R = supply?.items?.filter((id: string) => G.objects[id]?.type === 'Resource').length ?? 0;
                const N = Math.min(10, Math.floor(R / 2));
                for (let i = 0; i < N; i++) costSlots.push('ANY');
            }
        }
    }

    if (attr[`ignoreCostIncrease:${pid}`] && costSlots.length > 0) {
        costSlots.shift();
    }

    return costSlots;
}

export function checkAndPayCosts(
    G: GameState & { engine: EngineState },
    pid: string,
    actionType: string,
    tileId?: string,
    extraResourceIds?: string[]
): boolean {
    const attr = G.engine.attributes;
    const costSlots = getExtraCostSlots(G, pid, actionType, tileId);

    if (costSlots.length === 0) return true;

    const validation = validateCost(G, null, {
        playerId: pid,
        slots: costSlots,
        resourceIds: extraResourceIds
    });
    if (!validation.ok) return false;

    const committed = commitCost(G, null, {
        playerId: pid,
        slots: costSlots,
        resourceIds: validation.resourceIds
    });
    if (!committed) return false;

    // Consume one-time costs if applicable
    if (attr.playerExtraCosts?.[pid] > 0) attr.playerExtraCosts[pid]--;

    return true;
}
