import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { clearLastSession } from '../src/lobby/session';

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
                    G: {
                        engine: {
                            attributes: {
                                enabledExpansions: ['exp01'],
                            },
                        },
                    },
                    ctx: {
                        numPlayers: 2,
                        currentPlayer: '0',
                        activePlayers: { '0': 'drawAndPlace' },
                        randomSeed: 'seed-test-123',
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

describe('LobbyScreen flow', () => {
    const serverUrl = 'http://localhost:8000';
    const gameName = 'balance-control';

    let matches: any[] = [];
    let fetchMock: ReturnType<typeof vi.fn>;
    let leaveShouldFail: boolean;

    async function renderApp({ enableDebugReplay = false }: { enableDebugReplay?: boolean } = {}) {
        vi.resetModules();
        vi.stubEnv('VITE_DEBUG_REPLAY', enableDebugReplay ? '1' : '0');
        const { default: App } = await import('../src/App');
        render(<App />);
    }

    beforeEach(() => {
        clientInstances.splice(0, clientInstances.length);
        clearLastSession();
        leaveShouldFail = false;

        matches = [
            {
                matchID: 'm1',
                gameName,
                players: [{ id: 0, name: 'Alice' }, { id: 1 }],
                setupData: { packs: { enabledPacks: [] } },
            },
        ];

        fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            const method = (init?.method ?? 'GET').toUpperCase();
            const body = init?.body ? JSON.parse(String(init.body)) : undefined;

            if (url === `${serverUrl}/games/${gameName}` && method === 'GET') {
                return jsonResponse({ matches });
            }

            if (url === `${serverUrl}/games/${gameName}/create` && method === 'POST') {
                const numPlayers = body?.numPlayers ?? 2;
                const matchID = `m${matches.length + 1}`;
                const players = Array.from({ length: numPlayers }, (_, i) => ({ id: i }));
                matches.push({ matchID, gameName, players, setupData: body?.setupData ?? null });
                return jsonResponse({ matchID });
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
                    return jsonResponse({ error: 'leave failed' }, 500);
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
        vi.unstubAllEnvs();
        clearLastSession();
    });

    it('lists matches and renders seat join buttons', async () => {
        await renderApp();
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m1');

        expect(screen.getByTestId('lobby-seat-m1-0').textContent).toContain('Alice');
        expect(screen.getByTestId('lobby-seat-m1-1').textContent).toContain('Empty');

        const joinBtn = screen.getByTestId('lobby-join-m1-1') as HTMLButtonElement;
        expect(joinBtn.disabled).toBe(true);
    });

    it('does not require joining bot seats in lobby list', async () => {
        matches = [
            {
                matchID: 'm2',
                gameName,
                players: [{ id: 0 }, { id: 1 }],
                setupData: {
                    seats: {
                        '0': { role: 'human' },
                        '1': { role: 'bot', provider: 'ollama', model: 'llama3.1:8b' }
                    }
                },
            },
        ];

        await renderApp();
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m2');

        expect(screen.getByTestId('lobby-seat-m2-1').textContent).toContain('Bot (auto)');
        expect(screen.queryByTestId('lobby-join-m2-1')).toBeNull();
    });

    it('joins a seat and transitions to the game screen using credentials', async () => {
        await renderApp();
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m1');

        fireEvent.change(screen.getByTestId('lobby-player-name'), { target: { value: 'Bob' } });

        const joinBtn = screen.getByTestId('lobby-join-m1-1') as HTMLButtonElement;
        await waitFor(() => expect(joinBtn.disabled).toBe(false));
        fireEvent.click(joinBtn);

        await screen.findByTestId('game-screen');
        expect(screen.getByTestId('game-topbar').textContent).toContain('Match m1');

        expect(clientInstances).toHaveLength(1);
        expect(clientInstances[0].config).toMatchObject({
            matchID: 'm1',
            playerID: '1',
            credentials: 'cred-1',
        });

        const joinCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/join'));
        expect(joinCall).toBeTruthy();
        const joinInit = joinCall?.[1] as RequestInit | undefined;
        expect(JSON.parse(String(joinInit?.body))).toMatchObject({ playerID: '1', playerName: 'Bob' });
    });

    it('quits the game via leaveMatch and returns to the lobby', async () => {
        await renderApp();
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m1');

        fireEvent.change(screen.getByTestId('lobby-player-name'), { target: { value: 'Bob' } });
        const joinBtn = screen.getByTestId('lobby-join-m1-1') as HTMLButtonElement;
        await waitFor(() => expect(joinBtn.disabled).toBe(false));
        fireEvent.click(joinBtn);
        await screen.findByTestId('game-screen');

        fireEvent.click(screen.getByTestId('quit-game'));

        await screen.findByTestId('start-screen');
        expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/leave'))).toBe(true);

        await waitFor(() => expect(clientInstances[0]?.stop).toHaveBeenCalledTimes(1));
    });

    it('shows quit error and stays in game screen when leaveMatch fails', async () => {
        leaveShouldFail = true;
        await renderApp();
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m1');

        fireEvent.change(screen.getByTestId('lobby-player-name'), { target: { value: 'Bob' } });
        const joinBtn = screen.getByTestId('lobby-join-m1-1') as HTMLButtonElement;
        await waitFor(() => expect(joinBtn.disabled).toBe(false));
        fireEvent.click(joinBtn);
        await screen.findByTestId('game-screen');

        fireEvent.click(screen.getByTestId('quit-game'));

        await screen.findByTestId('quit-error');
        expect(screen.queryByTestId('start-screen')).toBeNull();
        expect(screen.getByTestId('game-screen')).not.toBeNull();
    });

    it('copies replay payload JSON via clipboard in debug mode', async () => {
        const writeTextMock = vi.fn(async () => undefined);
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeTextMock },
        });

        await renderApp({ enableDebugReplay: true });
        fireEvent.click(screen.getByTestId('start-online-lobby'));

        await screen.findByTestId('lobby-match-m1');

        fireEvent.change(screen.getByTestId('lobby-player-name'), { target: { value: 'Bob' } });
        const joinBtn = screen.getByTestId('lobby-join-m1-1') as HTMLButtonElement;
        await waitFor(() => expect(joinBtn.disabled).toBe(false));
        fireEvent.click(joinBtn);
        await screen.findByTestId('game-screen');

        fireEvent.click(screen.getByRole('button', { name: 'Copy replay JSON' }));

        await waitFor(() => expect(writeTextMock).toHaveBeenCalledTimes(1));
        const copiedPayload = writeTextMock.mock.calls[0]?.[0];
        expect(() => JSON.parse(copiedPayload)).not.toThrow();
        const replay = JSON.parse(copiedPayload);
        expect(replay).toMatchObject({
            seed: 'seed-test-123',
            config: { expansions: ['exp01'] },
            moves: [],
        });
    });
});
