import type { ReplayRecord, ReplaySink } from '@balance-control/game';

const HOTSEAT_REPLAY_ENDPOINT = '/api/replay/hotseat';

export class HotseatForwardingReplaySink implements ReplaySink {
    public writeRecord(record: ReplayRecord): void {
        const payload = JSON.stringify(record);

        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(HOTSEAT_REPLAY_ENDPOINT, blob);
            return;
        }

        if (typeof fetch !== 'undefined') {
            void fetch(HOTSEAT_REPLAY_ENDPOINT, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch((error) => {
                console.warn('[HotseatReplay] failed to forward replay record', error);
            });
        }
    }

    public close(): void {
        // no-op
    }
}
