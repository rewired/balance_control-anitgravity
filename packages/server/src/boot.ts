import { createBalanceControlGameWithHooks } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';
import { createReplaySink, readReplayDirectoryFromEnv } from './replay-logging';

export function registerServerPacks(): void {
    registerCanonicalPacks();
}

export function createServerGame() {
    registerServerPacks();

    const replaySink = createReplaySink({ replayDirectory: readReplayDirectoryFromEnv() });
    return createBalanceControlGameWithHooks({
        sink: replaySink,
        includeStateHash: true,
        onError: ({ error, record }) => console.error(`[ReplayLogger] Failed to save replay for match ${record.matchId ?? 'unknown'}`, error)
    });
}
