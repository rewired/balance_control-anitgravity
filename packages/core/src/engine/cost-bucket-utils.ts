import type { GameState } from '@balance-control/rules';
import { selectDeterministicCostResourceIds, type CostSlot } from './deterministic-cost';

/**
 * Validates that each cost bucket has unique IDs and that buckets do not overlap.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function validateDistinctCostBuckets(buckets: ReadonlyArray<ReadonlyArray<string> | undefined>): boolean {
    const seen = new Set<string>();
    for (const bucket of buckets) {
        if (!bucket) continue;
        const local = new Set<string>();
        for (const id of bucket) {
            if (local.has(id) || seen.has(id)) return false;
            local.add(id);
            seen.add(id);
        }
    }
    return true;
}

/**
 * Splits a combined list of resource IDs into semantic buckets by fixed lengths.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function splitCombinedResourceIds(combinedIds: ReadonlyArray<string> | undefined, bucketLengths: ReadonlyArray<number>): string[][] | null {
    const totalExpected = bucketLengths.reduce((sum, len) => sum + len, 0);
    const source = combinedIds ?? [];
    if (source.length !== totalExpected) return null;

    const result: string[][] = [];
    let offset = 0;
    for (const len of bucketLengths) {
        result.push(source.slice(offset, offset + len));
        offset += len;
    }
    return result;
}

/**
 * Resolves resource IDs for a cost bucket using explicit IDs when provided,
 * otherwise choosing deterministic fallback IDs from supply.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function resolveProvidedOrDeterministicResourceIds(
    G: GameState,
    playerId: string,
    slots: ReadonlyArray<CostSlot>,
    provided: ReadonlyArray<string> | undefined,
    excluded: ReadonlySet<string> = new Set()
): string[] | null {
    if (provided) {
        if (provided.length !== slots.length) return null;
        return [...provided];
    }

    return selectDeterministicCostResourceIds(G, playerId, [...slots], excluded);
}
