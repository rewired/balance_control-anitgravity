import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { clearLastSession, readLastSession, writeLastSession } from '../src/lobby/session';

const clientInstances: Array<{ config: any; stop: ReturnType<typeof vi.fn> }> = [];

vi.mock('../src/Board', () => {
    return {
        Board: () => <div data-testid="board-stub" />
    };
});

vi.mock('boardgame.io/multiplayer', () => {
    return {
        SocketIO: () => ({})
    };
});

vi.mock('boardgame.io/client', async () => {
    const actual = await vi.importActual<typeof import('boardgame.io/client')>('boardgame.io/client');
    return {
        ...actual,
        Client: vi.fn((config: any) => {
            const instance = {
                config,
                moves: {},
                start: vi.fn(),
                stop: vi.fn(),
                getState: vi.fn(() => ({
                    G: {},
                    ctx: {
                        numPlayers: 2,
                        currentPlayer: '0',
                        activePlayers: { '0': 'drawAndPlace' },
                        gameover: null,
                    },
                    isConnected: true,
                })),
                subscribe: vi.fn(() => () => undefined),
            };
            clientInstances.push(instance);
            return instance as any;
        }),
    };
});

function jsonResponse(body: any, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('Lobby session persistence', () => {
    const serverUrl = 'http://localhost:8000';
    const gameName = 'balance-control';

    let fetchMock: ReturnType<typeof vi.fn>;
    let matches: any[];
    let leaveShouldFail: boolean;

    beforeEach(() => {
        clientInstances.splice(0, clientInstances.length);
        clearLastSession();
        leaveShouldFail = false;

        matches = [
            {
                matchID: 'm1',
                gameName,
                players: [{ id: 0, name: 'Alice' }, { id: 1 }],
                setupData: { expansions: { ex01: false, ex02: false, ex03: false } },
            },
        ];

        fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            const method = (init?.method ?? 'GET').toUpperCase();
            const body = init?.body ? JSON.parse(String(init.body)) : undefined;

            if (url === `${serverUrl}/games/${gameName}` && method === 'GET') {
                return jsonResponse({ matches });
            }

            const joinMatch = url.match(new RegExp(`^${serverUrl}/games/${gameName}/([^/]+)/join$`));
            if (joinMatch && method === 'POST') {
                const matchID = joinMatch[1];
                return jsonResponse({
                    matchID,
                    playerID: body?.playerID ?? '0',
                    playerCredentials: `cred-${body?.playerID ?? '0'}`,
                });
            }

            const leaveMatch = url.match(new RegExp(`^${serverUrl}/games/${gameName}/([^/]+)/leave$`));
            if (leaveMatch && method === 'POST') {
                if (leaveShouldFail) {
                    return jsonResponse({ error: 'nope' }, 500);
                }
                return jsonResponse({});
            }

            return jsonResponse({ error: `Unhandled ${method} ${url}` }, 500);
        });

        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        clearLastSession();
    });

    it('writes last session to localStorage on join', async () => {
        render(<App />);

        await screen.findByTestId('lobby-match-m1');

        fireEvent.change(screen.getByTestId('lobby-player-name'), { target: { value: 'Bob' } });
        const joinBtn = (await screen.findByTestId('lobby-join-m1-1')) as HTMLButtonElement;
        await waitFor(() => expect(joinBtn.disabled).toBe(false));
        fireEvent.click(joinBtn);

        await screen.findByTestId('game-screen');

        expect(readLastSession()).toMatchObject({
            matchID: 'm1',
            playerID: '1',
            credentials: 'cred-1',
            playerName: 'Bob',
            serverUrl,
        });
    });

    it('resumes using stored matchID/playerID/credentials (no re-join)', async () => {
        writeLastSession({
            matchID: 'm1',
            playerID: '0',
            credentials: 'cred-0',
            playerName: 'Alice',
            serverUrl,
        });

        render(<App />);

        await screen.findByTestId('lobby-last-session');
        fireEvent.click(screen.getByTestId('lobby-resume-last-match'));

        await screen.findByTestId('game-screen');

        expect(clientInstances).toHaveLength(1);
        expect(clientInstances[0].config).toMatchObject({
            matchID: 'm1',
            playerID: '0',
            credentials: 'cred-0',
        });

        expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/join'))).toBe(false);
    });

    it('leave clears saved session on success', async () => {
        writeLastSession({
            matchID: 'm1',
            playerID: '0',
            credentials: 'cred-0',
            playerName: 'Alice',
            serverUrl,
        });

        render(<App />);

        await screen.findByTestId('lobby-last-session');
        fireEvent.click(screen.getByTestId('lobby-leave-last-match'));

        await waitFor(() => expect(readLastSession()).toBeNull());
        await waitFor(() => expect(screen.queryByTestId('lobby-last-session')).toBeNull());

        expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/leave'))).toBe(true);
    });

    it('leave failure keeps saved session and enables force forget', async () => {
        leaveShouldFail = true;
        writeLastSession({
            matchID: 'm1',
            playerID: '0',
            credentials: 'cred-0',
            playerName: 'Alice',
            serverUrl,
        });

        render(<App />);

        await screen.findByTestId('lobby-last-session');
        fireEvent.click(screen.getByTestId('lobby-leave-last-match'));

        await screen.findByTestId('lobby-leave-last-match-error');
        expect(readLastSession()).not.toBeNull();

        fireEvent.click(screen.getByTestId('lobby-force-forget'));
        await waitFor(() => expect(readLastSession()).toBeNull());
    });
});
