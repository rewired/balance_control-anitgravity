import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';

const mockEnumerateLegalIntents = vi.fn();

vi.mock('@balance-control/game', () => ({
    enumerateLegalIntents: (...args: any[]) => mockEnumerateLegalIntents(...args)
}));

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
            'PersonalSupply:1': { id: 'PersonalSupply:1', name: 'PS', items: [] },
            Bank: { id: 'Bank', name: 'Bank', items: [] },
            Board: { id: 'Board', name: 'Board', items: ['tile_alpha'] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: [] },
            DiscardFaceUp: { id: 'DiscardFaceUp', name: 'DiscardFaceUp', items: ['tile_beta'] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            tile_alpha: { id: 'tile_alpha', name: 'Tile', items: [] },
            tile_beta: { id: 'tile_beta', name: 'Tile', items: [] },
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: TileType.Resort, resort: 'FOR', weight: 2 },
            tile_beta: { id: 'tile_beta', type: TileType.Committee }
        },
        objects: {},
        adjacency: {},
        grid: { '0,0': 'tile_alpha' },
        engine: {
            idSeq: 0,
            effectQueue: [],
            activeModifiers: [],
            history: [],
            attributes: {
                publicLog: [{ id: 'log_1', kind: 'tile.unplaceable', playerId: '0', tileId: 'tile_beta' }]
            }
        }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'drawAndPlace' } };

describe('PublicNoticeOverlay (unplaceable draw)', () => {
    it('shows notice to non-drawer without confirm', () => {
        ensureResizeObserver();
        mockEnumerateLegalIntents.mockReturnValue([]);

        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{ resolveChoice: vi.fn() }}
                playerID={'1'}
                isActive={false}
            />
        );

        expect(screen.getByTestId('public-notice-overlay')).not.toBeNull();
        expect(screen.getByText('Player 0 drew a tile that cannot be placed. It was discarded face-up.')).not.toBeNull();
        expect(screen.getByTestId('public-notice-tile')).not.toBeNull();
        expect(screen.queryByTestId('pending-choice-overlay')).toBeNull();
    });

    it('shows notice to drawer and renders confirm via pendingChoice modal', () => {
        ensureResizeObserver();
        mockEnumerateLegalIntents.mockReturnValue([
            { moveType: 'resolveChoice', payload: { choiceId: 'choice_1', selection: 'OK' } }
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

        expect(screen.getByTestId('public-notice-overlay')).not.toBeNull();
        expect(screen.getByText('Player 0 drew a tile that cannot be placed. It was discarded face-up.')).not.toBeNull();
        expect(screen.getByTestId('pending-choice-overlay')).not.toBeNull();
        expect(screen.getByText('OK')).not.toBeNull();
    });
});

