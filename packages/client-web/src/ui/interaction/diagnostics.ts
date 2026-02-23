import { canonicalJsonStringify } from './utils';

/**
 * Computes a lightweight, presentation-only fingerprint for a {G, ctx} snapshot.
 * @remarks
 * Used for hotseat diagnostics only (dev mode) to detect UI render vs move-dispatch mismatches.
 * Must not be used for gameplay logic (ARCH-01).
 */
export function computeUiStateKey(G: any, ctx: any): string {
    return canonicalJsonStringify({
        turn: ctx?.turn ?? null,
        phase: ctx?.phase ?? null,
        currentPlayer: ctx?.currentPlayer ?? null,
        activePlayers: ctx?.activePlayers ?? null,
        pendingChoiceId: G?.engine?.pendingChoice?.choiceId ?? null,
    });
}

