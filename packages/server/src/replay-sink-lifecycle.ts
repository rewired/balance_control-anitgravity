import type { ReplaySink } from '@balance-control/game';

export type CloseableReplaySink = ReplaySink & Required<Pick<ReplaySink, 'close'>>;

export type ProcessSignalRegistrar = Pick<NodeJS.Process, 'once' | 'exit'>;

/**
 * Registers process shutdown hooks that finalize replay sink footer emission
 * exactly once for all termination paths.
 */
export function registerReplaySinkShutdownHandlers(
    sink: CloseableReplaySink,
    proc: ProcessSignalRegistrar = process
): void {
    let closed = false;

    const closeOnce = (): void => {
        if (closed) return;
        closed = true;
        sink.close();
    };

    const handleSignal = (signal: NodeJS.Signals): void => {
        try {
            closeOnce();
        }
        finally {
            proc.exit(signal === 'SIGINT' ? 130 : 143);
        }
    };

    proc.once('SIGINT', () => handleSignal('SIGINT'));
    proc.once('SIGTERM', () => handleSignal('SIGTERM'));
    proc.once('beforeExit', closeOnce);
    proc.once('exit', closeOnce);
}
