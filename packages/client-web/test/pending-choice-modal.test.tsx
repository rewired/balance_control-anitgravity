import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';

const mockEnumerateLegalIntents = vi.fn();

vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<any>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: (...args: any[]) => mockEnumerateLegalIntents(...args)
    };
});

afterEach(() => {
    cleanup();
    mockEnumerateLegalIntents.mockReset();
});

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

const ensureResizeObserver = () => {
    if (!('ResizeObserver' in window)) {
        (window as any).ResizeObserver = ResizeObserverMock;
    }
};

const createState = () => {
    return {
        zones: {
            'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PS', items: [] },
            Bank: { id: 'Bank', name: 'Bank', items: [] },
            Board: { id: 'Board', name: 'Board', items: ['tile_alpha'] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: [] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            tile_alpha: { id: 'tile_alpha', name: 'Tile', items: [] },
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: TileType.Resort, resort: 'FOR', weight: 2 }
        },
        objects: {},
        adjacency: {},
        grid: { '0,0': 'tile_alpha' },
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'politicalAction' } };

describe('PendingChoiceModal', () => {
    it('renders when resolveChoice intents exist', () => {
        ensureResizeObserver();
        mockEnumerateLegalIntents.mockReturnValue([
            { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'A' } }
        ]);
        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{ resolveChoice: vi.fn() }}
                playerID={'0'}
                isActive={true}
            />
        );

        expect(screen.getByTestId('pending-choice-overlay')).not.toBeNull();
        expect(screen.getByText('Decision required')).not.toBeNull();
    });

    it('hides other controls while pending choice is visible', () => {
        ensureResizeObserver();
        mockEnumerateLegalIntents.mockReturnValue([
            { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'A' } },
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } }
        ]);
        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{ resolveChoice: vi.fn(), placeInfluence: vi.fn() }}
                playerID={'0'}
                isActive={true}
            />
        );

        expect(screen.queryByTestId('btn-place-influence')).toBeNull();
    });

    it('dispatches resolveChoice only after confirmation', () => {
        ensureResizeObserver();
        const resolveChoice = vi.fn();
        mockEnumerateLegalIntents.mockReturnValue([
            { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'b' } },
            { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'a' } }
        ]);
        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{ resolveChoice }}
                playerID={'0'}
                isActive={true}
            />
        );

        const firstOption = screen.getByTestId('pending-choice-option-0');
        const confirmButton = screen.getByTestId('pending-choice-confirm') as HTMLButtonElement;

        // Initial state: Confirm disabled
        expect(confirmButton.disabled).toBe(true);

        expect(firstOption.textContent).toBe('a');
        fireEvent.click(firstOption);

        // Not dispatched yet
        expect(resolveChoice).not.toHaveBeenCalled();
        expect(confirmButton.disabled).toBe(false);

        // Confirm
        fireEvent.click(confirmButton);
        expect(resolveChoice).toHaveBeenCalledTimes(1);
        expect(resolveChoice).toHaveBeenCalledWith({ choiceId: 'choice-1', selection: 'a' });
    });

    it('does NOT render modal when pendingChoice.kind === "selectTile"', () => {
        ensureResizeObserver();
        const state = createState();
        state.engine.pendingChoice = {
            kind: 'selectTile',
            resolveChoice: [
                { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'tile_alpha' } }
            ]
        };

        mockEnumerateLegalIntents.mockReturnValue(state.engine.pendingChoice.resolveChoice);

        render(
            <GameLayout
                G={state}
                ctx={baseCtx}
                moves={{ resolveChoice: vi.fn() }}
                playerID={'0'}
                isActive={true}
            />
        );

        expect(screen.queryByTestId('pending-choice-overlay')).toBeNull();
    });

    it('allows board interaction when pendingChoice.kind === "selectTile"', () => {
        ensureResizeObserver();
        const resolveChoice = vi.fn();
        const state = createState();
        state.engine.pendingChoice = {
            kind: 'selectTile',
            resolveChoice: [
                { moveType: 'resolveChoice', payload: { choiceId: 'choice-1', selection: 'tile_alpha' } }
            ]
        };

        mockEnumerateLegalIntents.mockReturnValue(state.engine.pendingChoice.resolveChoice);

        render(
            <GameLayout
                G={state}
                ctx={baseCtx}
                moves={{ resolveChoice }}
                playerID={'0'}
                isActive={true}
            />
        );

        // Find the tile on the board
        const tile = screen.getByTestId('hex-tile-0_0');

        // It should have highlight class (we need to implement this)
        // For now just check click dispatch
        fireEvent.click(tile);

        expect(resolveChoice).toHaveBeenCalledTimes(1);
        expect(resolveChoice).toHaveBeenCalledWith({ choiceId: 'choice-1', selection: 'tile_alpha' });
    });
});
