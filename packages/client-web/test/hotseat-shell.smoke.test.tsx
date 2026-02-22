import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HotseatShell } from '../src/hotseat/HotseatShell';

const clientInstances: Array<{ config: any; stop: ReturnType<typeof vi.fn> }> = [];

vi.mock('boardgame.io/multiplayer', () => {
    return {
        Local: vi.fn(() => ({ __kind: 'local' })),
        SocketIO: vi.fn(() => ({})),
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

vi.mock('../src/Board', () => {
    return {
        Board: () => <div data-testid="board-stub" />
    };
});

describe('HotseatShell', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        clientInstances.splice(0, clientInstances.length);
    });

    it('renders and switches seats without crashing', () => {
        render(<HotseatShell />);

        expect(screen.getByTestId('hotseat-topbar')).toBeTruthy();
        expect(screen.getByTestId('hotseat-status').textContent).toContain('Active seat P0');
        expect(screen.getByTestId('board-stub')).toBeTruthy();

        fireEvent.click(screen.getByTestId('hotseat-switch-1'));
        expect(screen.getByTestId('hotseat-status').textContent).toContain('Active seat P1');

        expect(clientInstances).toHaveLength(3);
        const playerIDs = clientInstances.map((x) => x.config.playerID);
        expect(playerIDs).toContain('0');
        expect(playerIDs).toContain('1');
        expect(playerIDs).toContain(null);

        const matchIDs = new Set(clientInstances.map((x) => x.config.matchID));
        expect(Array.from(matchIDs)).toEqual(['local-hotseat-2p']);
    });
});

