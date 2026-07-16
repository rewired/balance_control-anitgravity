import { GameState } from '@balance-control/rules';
import { EnginePackRegistry } from '../expansion-registry';

type JsonLike =
    | null
    | boolean
    | number
    | string
    | JsonLike[]
    | { [key: string]: JsonLike | undefined };

function canonicalize(value: JsonLike): JsonLike {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => canonicalize(entry as JsonLike));
    }

    const input = value as { [key: string]: JsonLike | undefined };
    const ordered: { [key: string]: JsonLike } = {};
    const keys = Object.keys(input).sort();

    for (const key of keys) {
        const entry = input[key];
        if (entry !== undefined) {
            ordered[key] = canonicalize(entry);
        }
    }

    return ordered;
}

function canonicalJsonStringify(value: JsonLike): string {
    return JSON.stringify(canonicalize(value));
}

export interface LegalIntent {
    moveType: string;
    payload: any;
    contextTileId?: string;
    description?: string;
    consequences?: string[];
}

const LEGAL_INTENT_BUDGET = 2000;

/**
 * Enumerates all legal moves for a player in the current state by
 * dispatching to each enabled pack's `enumerateIntents` contribution and
 * merging the results in canonical order.
 *
 * Ruleset-agnostic: this function itself contains no CORE ruleset (or
 * any other pack's) domain logic — see `packs/core/legal-intents.ts`
 * for CORE's contribution.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function enumerateLegalIntents(G: GameState, ctx: any, playerID: string): LegalIntent[] {
    if (!playerID) return [];
    if (ctx.currentPlayer !== playerID) return [];

    // GR-006: if a pending choice is open, only its owner may act, and only
    // via ResolveChoice - packs are still responsible for enumerating the
    // resolveChoice options themselves via enumerateIntents.
    const pendingChoice = G.engine?.pendingChoice;
    if (pendingChoice && pendingChoice.player !== playerID) return [];

    const intents: LegalIntent[] = [];
    for (const pack of EnginePackRegistry.getEnabledPacks(G)) {
        if (typeof pack.enumerateIntents === 'function') {
            appendIntents(intents, pack.enumerateIntents(G, ctx, playerID));
        }
    }

    return sortIntents(intents).slice(0, LEGAL_INTENT_BUDGET);
}

function sortIntents(intents: LegalIntent[]): LegalIntent[] {
    return [...intents].sort((a, b) => {
        const typeCmp = a.moveType.localeCompare(b.moveType);
        if (typeCmp !== 0) return typeCmp;
        const aPayload = canonicalJsonStringify(a.payload ?? {});
        const bPayload = canonicalJsonStringify(b.payload ?? {});
        return aPayload.localeCompare(bPayload);
    });
}

function appendIntents(target: LegalIntent[], additions: LegalIntent[]): void {
    for (const intent of additions) {
        target.push(intent);
    }
}
