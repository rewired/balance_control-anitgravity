import { describe, expect, it, vi } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { withReplaySink, type ReplayActionRecord } from '../src/engine/replay-sink';

describe('withReplaySink', () => {
    const makeContext = () => ({
        G: { engine: { attributes: {} } },
        ctx: { currentPlayer: '0', turn: 1, phase: 'politicalAction' },
    });

    it('writes only successfully executed moves with monotone seq', () => {
        const records: ReplayActionRecord[] = [];

        const wrapped = withReplaySink(
            {
                okMove: () => undefined,
                invalidMove: () => INVALID_MOVE,
            },
            {
                sink: {
                    writeAction: (record) => {
                        records.push(record);
                    },
                },
            }
        );

        wrapped.invalidMove(makeContext() as any, { id: 'a' });
        wrapped.okMove(makeContext() as any, { id: 'b' });
        wrapped.okMove(makeContext() as any, { id: 'c' });

        expect(records).toEqual([
            {
                seq: 0,
                player: '0',
                moveType: 'okMove',
                args: [{ id: 'b' }],
                turn: 1,
                phase: 'politicalAction',
                stateHash: undefined,
            },
            {
                seq: 1,
                player: '0',
                moveType: 'okMove',
                args: [{ id: 'c' }],
                turn: 1,
                phase: 'politicalAction',
                stateHash: undefined,
            },
        ]);
    });

    it('is best-effort and emits sink failures into the error channel', () => {
        const onError = vi.fn();

        const wrapped = withReplaySink(
            {
                okMove: () => undefined,
            },
            {
                sink: {
                    writeAction: () => {
                        throw new Error('sink failure');
                    },
                },
                onError,
            }
        );

        expect(() => wrapped.okMove(makeContext() as any, { id: 'x' })).not.toThrow();
        expect(onError).toHaveBeenCalledTimes(1);
        const event = onError.mock.calls[0][0];
        expect(event.record.seq).toBe(0);
        expect(event.record.moveType).toBe('okMove');
    });
});
