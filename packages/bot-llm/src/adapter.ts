import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import type { GameState } from '@balance-control/rules';
import { z } from 'zod';

export const LLMSelectionSchema = z.object({
    selectedIndex: z.number().int().nonnegative()
}).strict();

export type LLMSelection = z.infer<typeof LLMSelectionSchema>;

export interface LegalMoveOption {
    index: number;
    intent: LegalIntent;
}

export interface BotSelectionResult {
    selectedIntent: LegalIntent | null;
    selectedIndex: number;
    usedFallback: boolean;
    reason: 'ok' | 'invalid-json' | 'schema-violation' | 'out-of-range' | 'stale-selection' | 'no-legal-moves';
}

/**
 * Deterministically enumerates legal move options as index-addressable choices.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function enumerateDeterministicLegalMoves(G: GameState, ctx: unknown, playerID: string): LegalMoveOption[] {
    const intents = enumerateLegalIntents(G, ctx, playerID);
    return intents.map((intent, index) => ({ index, intent }));
}

/**
 * Parses and validates strict JSON response in the form `{ selectedIndex: number }`.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function parseLLMSelection(rawResponse: string):
    | { ok: true; value: LLMSelection }
    | { ok: false; reason: 'invalid-json' | 'schema-violation' } {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawResponse);
    } catch {
        return { ok: false, reason: 'invalid-json' };
    }

    const result = LLMSelectionSchema.safeParse(parsed);
    if (!result.success) {
        return { ok: false, reason: 'schema-violation' };
    }

    return { ok: true, value: result.data };
}

/**
 * Resolves an LLM-proposed index against the current legal move surface.
 * Falls back deterministically to index 0 when response is invalid.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function selectIntentFromLLMResponse(params: {
    G: GameState;
    ctx: unknown;
    playerID: string;
    rawResponse: string;
    expectedLegalMoves?: LegalMoveOption[];
}): BotSelectionResult {
    const currentLegalMoves = enumerateDeterministicLegalMoves(params.G, params.ctx, params.playerID);
    if (currentLegalMoves.length === 0) {
        return {
            selectedIntent: null,
            selectedIndex: -1,
            usedFallback: true,
            reason: 'no-legal-moves'
        };
    }

    const parsed = parseLLMSelection(params.rawResponse);
    if (!parsed.ok) {
        return fallback(currentLegalMoves, parsed.reason);
    }

    const { selectedIndex } = parsed.value;
    if (selectedIndex < 0 || selectedIndex >= currentLegalMoves.length) {
        return fallback(currentLegalMoves, 'out-of-range');
    }

    const expected = params.expectedLegalMoves;
    if (expected && !isSelectionStillValid(expected, currentLegalMoves, selectedIndex)) {
        return fallback(currentLegalMoves, 'stale-selection');
    }

    return {
        selectedIntent: currentLegalMoves[selectedIndex].intent,
        selectedIndex,
        usedFallback: false,
        reason: 'ok'
    };
}

function fallback(
    legalMoves: LegalMoveOption[],
    reason: Exclude<BotSelectionResult['reason'], 'ok' | 'no-legal-moves'>
): BotSelectionResult {
    return {
        selectedIntent: legalMoves[0].intent,
        selectedIndex: 0,
        usedFallback: true,
        reason
    };
}

function isSelectionStillValid(expected: LegalMoveOption[], current: LegalMoveOption[], index: number): boolean {
    if (index >= expected.length || index >= current.length) return false;
    return serializeOption(expected[index]) === serializeOption(current[index]);
}

function serializeOption(option: LegalMoveOption): string {
    return JSON.stringify(canonicalize(option));
}

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike | undefined };

function canonicalize(value: unknown): JsonLike {
    if (value === null || typeof value !== 'object') {
        return value as JsonLike;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => canonicalize(entry));
    }

    const input = value as Record<string, unknown>;
    const out: Record<string, JsonLike> = {};
    for (const key of Object.keys(input).sort()) {
        const next = canonicalize(input[key]);
        if (next !== undefined) {
            out[key] = next;
        }
    }
    return out;
}
