import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLastSession, readLastSession, writeLastSession } from '../src/lobby/session';

describe('lobby/session utils', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        clearLastSession();
    });

    it('readLastSession returns null for invalid JSON', () => {
        localStorage.setItem('bc:lobby:lastSession', '{bad-json');

        expect(readLastSession()).toBeNull();
    });

    it('readLastSession returns null when required fields are missing or invalid', () => {
        localStorage.setItem(
            'bc:lobby:lastSession',
            JSON.stringify({
                matchID: 'm1',
                playerID: 0,
                credentials: 'cred-0',
                playerName: 'Alice',
                // serverUrl missing
            }),
        );

        expect(readLastSession()).toBeNull();
    });

    it('handles localStorage throws on read, write, and remove', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('read failed');
        });
        expect(readLastSession()).toBeNull();

        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('write failed');
        });
        expect(() => {
            writeLastSession({
                matchID: 'm1',
                playerID: '0',
                credentials: 'cred-0',
                playerName: 'Alice',
                serverUrl: 'http://localhost:8000',
            });
        }).not.toThrow();
        expect(setItemSpy).toHaveBeenCalledTimes(1);

        const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('remove failed');
        });
        expect(() => clearLastSession()).not.toThrow();
        expect(removeItemSpy).toHaveBeenCalledTimes(1);
    });
});
