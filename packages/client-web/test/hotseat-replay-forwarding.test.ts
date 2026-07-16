import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReplayRecord } from '@balance-control/game';
import { createClientGameWithReplayHooks } from '../src/game';
import { HotseatForwardingReplaySink } from '../src/replay/hotseat-forwarding-sink';
import { withReplaySink } from '@balance-control/core';

function makeHotseatContext() {
    return {
        G: {
            _isPlayerView: true,
            roundNumber: 1,
            engine: { attributes: { seed: 'hotseat-seed' } },
            zones: {
                staging_0: { items: [] },
                DrawPile: { items: [] },
                DiscardFaceUp: { items: [] },
                Board: { items: [] },
            },
            objects: {},
            tiles: {},
        },
        ctx: {
            currentPlayer: '0',
            turn: 1,
            phase: 'politicalAction',
            numPlayers: 2,
            _stateID: 11,
            matchID: 'local-hotseat-2p',
        },
    } as any;
}

describe('Hotseat replay forwarding', () => {
    const originalSendBeacon = navigator.sendBeacon;
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        if (originalSendBeacon) {
            Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: originalSendBeacon });
        } else {
            Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: undefined });
        }
        if (originalFetch) {
            globalThis.fetch = originalFetch;
        }
    });

    it('forwards action/checkpoint records for a legal hotseat move via sendBeacon and fetch', async () => {
        const sendBeaconMock = vi.fn(() => true);
        Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: sendBeaconMock });

        const forwardingSink = new HotseatForwardingReplaySink();
        // Search anchors: createClientGameWithReplayHooks + withReplaySink + HotseatForwardingReplaySink.
        expect(createClientGameWithReplayHooks({ sink: forwardingSink }).name).toBe('balance-control');
        const wrappedMoves = withReplaySink({
            hotseatLegalMove: ({ ctx }: any) => {
                ctx._stateID = Number(ctx._stateID ?? 0) + 1;
                return undefined;
            },
        }, { sink: forwardingSink });

        wrappedMoves.hotseatLegalMove(makeHotseatContext(), { intentId: 'legal-hotseat-action' });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(sendBeaconMock).toHaveBeenCalled();

        Object.defineProperty(navigator, 'sendBeacon', { configurable: true, writable: true, value: undefined });
        const fetchRecords: ReplayRecord[] = [];
        globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
            if (typeof init?.body === 'string') {
                fetchRecords.push(JSON.parse(init.body) as ReplayRecord);
            }
            return new Response(null, { status: 204 });
        }) as typeof fetch;

        const fetchContext = makeHotseatContext();
        fetchContext.ctx._stateID = 30;
        wrappedMoves.hotseatLegalMove(fetchContext, { intentId: 'legal-hotseat-action-fetch' });
        await Promise.resolve();

        expect(fetchRecords.some((record) => record.recordType === 'action')).toBe(true);
        expect(fetchRecords.some((record) => record.recordType === 'checkpoint.turnEnd')).toBe(true);
        const fetchFooter = fetchRecords.find((record: any) => record.recordType === 'footer') as any;
        if (fetchFooter) {
            expect(fetchFooter.totalActions).toBeGreaterThan(0);
        }
    });
});
