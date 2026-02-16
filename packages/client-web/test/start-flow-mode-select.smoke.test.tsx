import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';

vi.mock('../src/Board', () => {
    return {
        Board: () => <div data-testid="board-stub" />
    };
});

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
        LobbyClient: vi.fn(() => ({
            listMatches: vi.fn(async () => ({ matches: [] })),
        })),
        Client: vi.fn(() => ({
            moves: {},
            start: vi.fn(),
            stop: vi.fn(),
            getState: vi.fn(() => ({
                G: {},
                ctx: { numPlayers: 2, currentPlayer: '0', activePlayers: { '0': 'drawAndPlace' }, gameover: null },
                isConnected: true,
            })),
            subscribe: vi.fn(() => () => undefined),
        })),
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('Start flow mode select', () => {
    it('switches between hotseat and online lobby', async () => {
        render(<App />);

        expect(screen.getByTestId('start-screen')).toBeTruthy();

        fireEvent.click(screen.getByTestId('start-hotseat'));
        expect(await screen.findByTestId('hotseat-topbar')).toBeTruthy();

        fireEvent.click(screen.getByTestId('back-to-start'));
        expect(await screen.findByTestId('start-screen')).toBeTruthy();

        fireEvent.click(screen.getByTestId('start-online-lobby'));
        expect(await screen.findByTestId('lobby-screen')).toBeTruthy();
    });
});

