import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { registerReplaySinkShutdownHandlers } from './replay-sink-lifecycle';

class ProcessDouble extends EventEmitter {
    public exit = vi.fn() as unknown as (code?: number) => never;
    public once(event: any, listener: any): this {
        return super.once(event, listener);
    }
}

describe('registerReplaySinkShutdownHandlers', () => {
    it('calls replay sink close exactly once across beforeExit and exit paths', () => {
        const close = vi.fn();
        const proc = new ProcessDouble();

        registerReplaySinkShutdownHandlers({ writeRecord: () => undefined, close }, proc as any);

        proc.emit('beforeExit');
        proc.emit('exit');

        expect(close).toHaveBeenCalledTimes(1);
    });

    it('closes sink and exits with signal code for SIGTERM', () => {
        const close = vi.fn();
        const proc = new ProcessDouble();

        registerReplaySinkShutdownHandlers({ writeRecord: () => undefined, close }, proc as any);

        proc.emit('SIGTERM');

        expect(close).toHaveBeenCalledTimes(1);
        expect(proc.exit).toHaveBeenCalledWith(143);
    });
});
