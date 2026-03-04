import { canonicalJsonStringify } from './utils';
import type { LegalIntent } from '@balance-control/game';

export interface FormalizeGroup {
    paymentKey: string;
    paymentResorts: string[];
    variants: LegalIntent[];
}

/**
 * Groups formalizeInfluence intents by committee tile and then by payment combo.
 * @remarks Presentation-only.
 * @see CORE-01-04-13
 * @see CORE-01-04-14
 * @see CORE-01-04-15
 */
export function groupFormalizeIntents(intents: LegalIntent[]): Map<string, FormalizeGroup[]> {
    const formalizeIntents = intents.filter((i) => i.moveType === 'formalizeInfluence');
    const byCommittee = new Map<string, Map<string, LegalIntent[]>>();

    for (const intent of formalizeIntents) {
        const committeeTileId = intent.payload?.committeeTileId;
        if (typeof committeeTileId !== 'string') continue;

        // Payment key is derived from the paymentResorts.
        const paymentResorts: string[] = intent.payload?.paymentResorts ?? [];
        const paymentKey = [...paymentResorts].sort().join('|');

        if (!byCommittee.has(committeeTileId)) {
            byCommittee.set(committeeTileId, new Map());
        }

        const groupsForCommittee = byCommittee.get(committeeTileId)!;
        if (!groupsForCommittee.has(paymentKey)) {
            groupsForCommittee.set(paymentKey, []);
        }
        groupsForCommittee.get(paymentKey)!.push(intent);
    }

    const result = new Map<string, FormalizeGroup[]>();

    for (const [committeeTileId, groupsMap] of byCommittee.entries()) {
        const groups: FormalizeGroup[] = [];
        for (const [paymentKey, variants] of groupsMap.entries()) {
            // Sort variants by full canonical payload to ensure deterministic ordering.
            const sortedVariants = [...variants].sort((a, b) => {
                return canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {}));
            });

            groups.push({
                paymentKey,
                paymentResorts: variants[0].payload?.paymentResorts ?? [],
                variants: sortedVariants
            });
        }

        // Sort groups by paymentKey lexicographically as per spec.
        groups.sort((a, b) => a.paymentKey.localeCompare(b.paymentKey));
        result.set(committeeTileId, groups);
    }

    return result;
}
