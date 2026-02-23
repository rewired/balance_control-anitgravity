import { CoreZoneName, type GameState } from '@balance-control/rules';

export type CostSlot = string[] | 'ANY';

/**
 * Deterministically selects concrete resource IDs from PersonalSupply to satisfy a cost.
 *
 * Selection policy:
 * - Filter to Resource objects owned by the player currently in PersonalSupply.
 * - Sort candidate IDs lexicographically (canonical).
 * - For each slot, pick the first unused candidate that matches the slot constraint.
 *
 * @remarks infrastructure; used to collapse fungible-payment intent combinations
 * @deterministic
 * @pure
 */
export function selectDeterministicCostResourceIds(
    G: GameState,
    playerId: string,
    slots: CostSlot[],
    excluded: ReadonlySet<string> = new Set()
): string[] | null {
    if (slots.length === 0) return [];

    const supplyId = `${CoreZoneName.PersonalSupply}:${playerId}`;
    const supply: any = (G as any).zones?.[supplyId];
    if (!supply) return null;

    const candidates: string[] = (supply.items ?? [])
        .filter((rid: string) => !excluded.has(rid))
        .filter((rid: string) => {
            const obj: any = (G as any).objects?.[rid];
            return obj && obj.type === 'Resource' && obj.owner === playerId;
        })
        .sort((a: string, b: string) => a.localeCompare(b));

    const used = new Set<string>();
    const selected: string[] = [];

    for (const slot of slots) {
        const normalizedSlot: CostSlot = slot === 'ANY' || (Array.isArray(slot) && slot.includes('ANY')) ? 'ANY' : slot;

        let picked: string | undefined;
        for (const rid of candidates) {
            if (used.has(rid)) continue;
            const obj: any = (G as any).objects?.[rid];
            if (!obj || obj.type !== 'Resource') continue;

            if (normalizedSlot === 'ANY' || normalizedSlot.includes(obj.resort)) {
                picked = rid;
                break;
            }
        }

        if (!picked) return null;
        used.add(picked);
        selected.push(picked);
    }

    return selected;
}

