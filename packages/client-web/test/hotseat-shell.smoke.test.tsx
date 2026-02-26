import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HotseatShell } from '../src/hotseat/HotseatShell';

const clientInstances: Array<{ config: any; stop: ReturnType<typeof vi.fn>; updatePlayerID: ReturnType<typeof vi.fn> }> = [];

let mockClientState: any = {
    G: {},
    ctx: {
        numPlayers: 2,
        currentPlayer: '0',
        activePlayers: { '0': 'drawAndPlace' },
        gameover: null,
    },
    isConnected: true,
};

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
                updatePlayerID: vi.fn(),
                getState: vi.fn(() => mockClientState),
                subscribe: vi.fn(() => () => undefined),
            };
            clientInstances.push(instance);
            return instance as any;
        }),
    };
});

vi.mock('../src/Board', () => {
    return {
        Board: ({ onTripwireMismatch }: { onTripwireMismatch: (info: { moveType: string }) => void }) => (
            <div data-testid="board-stub">
                <button
                    type="button"
                    data-testid="board-tripwire-trigger"
                    onClick={() => onTripwireMismatch({ moveType: 'placeInfluence' })}
                >
                    trigger tripwire
                </button>
            </div>
        )
    };
});

describe('HotseatShell', () => {
    const originalEnableHooks = (window as any).__BC_ENABLE_E2E_HOOKS__;
    const originalApi = (window as any).__BC_HOTSEAT_E2E__;
    const originalSnapshot = (window as any).__BC_HOTSEAT_E2E_STATE__;

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        clientInstances.splice(0, clientInstances.length);
        mockClientState = {
            G: {},
            ctx: {
                numPlayers: 2,
                currentPlayer: '0',
                activePlayers: { '0': 'drawAndPlace' },
                gameover: null,
            },
            isConnected: true,
        };

        if (originalEnableHooks === undefined) {
            delete (window as any).__BC_ENABLE_E2E_HOOKS__;
        } else {
            (window as any).__BC_ENABLE_E2E_HOOKS__ = originalEnableHooks;
        }

        if (originalApi === undefined) {
            delete (window as any).__BC_HOTSEAT_E2E__;
        } else {
            (window as any).__BC_HOTSEAT_E2E__ = originalApi;
        }

        if (originalSnapshot === undefined) {
            delete (window as any).__BC_HOTSEAT_E2E_STATE__;
        } else {
            (window as any).__BC_HOTSEAT_E2E_STATE__ = originalSnapshot;
        }
    });

    it('renders and switches seats without crashing', () => {
        render(<HotseatShell />);

        expect(screen.getByTestId('hotseat-topbar')).toBeTruthy();
        expect(screen.getByTestId('hotseat-status').textContent).toContain('Active seat P0');
        expect(screen.getByTestId('board-stub')).toBeTruthy();

        fireEvent.click(screen.getByTestId('hotseat-switch-1'));
        expect(screen.getByTestId('hotseat-status').textContent).toContain('Active seat P1');

        expect(clientInstances).toHaveLength(1);
        expect(clientInstances[0].config.playerID).toBe('0');
        expect(clientInstances[0].updatePlayerID).toHaveBeenCalledWith('1');

        const matchIDs = new Set(clientInstances.map((x) => x.config.matchID));
        expect(Array.from(matchIDs)).toEqual(['local-hotseat-2p']);
    });

    it('registers and unregisters E2E window hooks when enabled', () => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;

        const { unmount } = render(<HotseatShell />);

        const api = (window as any).__BC_HOTSEAT_E2E__;
        expect(api).toBeTruthy();
        expect(typeof api.getStateID).toBe('function');
        expect((window as any).__BC_HOTSEAT_E2E_STATE__).toBeTruthy();

        unmount();

        expect((window as any).__BC_HOTSEAT_E2E__).toBeUndefined();
        expect((window as any).__BC_HOTSEAT_E2E_STATE__).toBeUndefined();
    });

    it('does not remove a replaced E2E API reference during cleanup', () => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;

        const { unmount } = render(<HotseatShell />);
        const replacementApi = { replaced: true };
        (window as any).__BC_HOTSEAT_E2E__ = replacementApi;

        unmount();

        expect((window as any).__BC_HOTSEAT_E2E__).toBe(replacementApi);
        expect((window as any).__BC_HOTSEAT_E2E_STATE__).toBeUndefined();
    });

    it('renders loading state when client snapshot is null', () => {
        mockClientState = null;

        render(<HotseatShell />);

        expect(screen.getByTestId('hotseat-loading').textContent).toContain('Loading hotseat match');
        expect(screen.queryByTestId('hotseat-game-screen')).toBeNull();
    });

    it('renders loading state when client snapshot has no G/ctx', () => {
        mockClientState = { isConnected: true };

        render(<HotseatShell />);

        expect(screen.getByTestId('hotseat-loading')).toBeTruthy();
        expect(screen.queryByTestId('board-stub')).toBeNull();
    });

    it.each([
        [{ _stateID: 11 }, 11, '_stateID'],
        [{ stateID: 22 }, 22, 'stateID'],
        [{ ctx: { _stateID: 33 } }, 33, 'ctx._stateID'],
        [{ ctx: { stateID: 44 } }, 44, 'ctx.stateID'],
        [{}, null, 'missing state ID'],
        [null, null, 'null snapshot'],
    ])('returns getStateID fallback from %s (%s)', (snapshot, expected, _label) => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
        mockClientState = snapshot;

        render(<HotseatShell />);

        expect((window as any).__BC_HOTSEAT_E2E__.getStateID()).toBe(expected);
    });

    it('sets and clears injected pendingChoice through E2E hooks', () => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
        mockClientState = {
            ...mockClientState,
            G: { engine: { pendingChoice: null } },
            ctx: { ...mockClientState.ctx, currentPlayer: '1' },
        };

        render(<HotseatShell />);

        const api = (window as any).__BC_HOTSEAT_E2E__;
        expect(api.getPendingChoiceKind()).toBeNull();

        api.setPendingChoice({ kind: 'selectTile', spec: { tileId: 'tile_A' } });

        expect(api.getPendingChoiceKind()).toBe('selectTile');
        expect(mockClientState.G.engine.pendingChoice).toMatchObject({
            sourceId: 'e2e_injected_pending_choice',
            player: '1',
            kind: 'selectTile',
            spec: { tileId: 'tile_A' },
        });

        api.clearPendingChoice();
        expect(api.getPendingChoiceKind()).toBeNull();
    });

    it('uses activeSeat fallback player and increments pendingChoice ids', () => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
        mockClientState = {
            ...mockClientState,
            G: { engine: { pendingChoice: null } },
            ctx: { ...mockClientState.ctx, currentPlayer: undefined },
        };

        render(<HotseatShell />);
        fireEvent.click(screen.getByTestId('hotseat-switch-1'));

        const api = (window as any).__BC_HOTSEAT_E2E__;
        api.setPendingChoice({ kind: 'firstChoice' });
        const firstChoice = mockClientState.G.engine.pendingChoice;
        api.setPendingChoice({ kind: 'secondChoice' });
        const secondChoice = mockClientState.G.engine.pendingChoice;

        expect(firstChoice.player).toBe('1');
        expect(firstChoice.choiceId).toBe('e2e_choice_0');
        expect(secondChoice.choiceId).toBe('e2e_choice_1');
        expect(secondChoice.player).toBe('1');
    });

    it('ignores pendingChoice mutation when state has no engine object', () => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
        mockClientState = { G: {}, ctx: { currentPlayer: '0' } };

        render(<HotseatShell />);
        const api = (window as any).__BC_HOTSEAT_E2E__;

        expect(() => api.setPendingChoice({ kind: 'selectTile' })).not.toThrow();
        expect(() => api.clearPendingChoice()).not.toThrow();
        expect(api.getPendingChoiceKind()).toBeNull();
    });

    it('shows a tripwire desync badge after board reports a mismatch', () => {
        render(<HotseatShell />);

        expect(screen.queryByTestId('hotseat-tripwire')).toBeNull();

        fireEvent.click(screen.getByTestId('board-tripwire-trigger'));

        const badge = screen.getByTestId('hotseat-tripwire');
        expect(badge.textContent).toContain('DESYNC');
        expect(badge.getAttribute('title')).toContain('placeInfluence');
    });
});
