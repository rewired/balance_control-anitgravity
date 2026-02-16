import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';

vi.mock('@balance-control/game', () => ({
    enumerateLegalIntents: () => []
}));

afterEach(() => {
    cleanup();
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
            Board: { id: 'Board', name: 'Board', items: [] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: ['__drawpile_0', '__drawpile_1', '__drawpile_2'] },
            DiscardFaceUp: { id: 'DiscardFaceUp', name: 'DiscardFaceUp', items: ['tile_discard_1'] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            tile_discard_1: { id: 'tile_discard_1', name: 'Tile', items: [] },
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {
            tile_discard_1: { id: 'tile_discard_1', type: TileType.Committee }
        },
        objects: {},
        adjacency: {},
        grid: {},
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'drawAndPlace' } };

describe('DrawPile and DiscardFaceUp UI', () => {
    it('renders DrawPile as count-only widget (no Zone renderer)', () => {
        ensureResizeObserver();
        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{}}
                playerID={'0'}
                isActive={false}
            />
        );

        expect(screen.getByTestId('draw-bag-widget')).not.toBeNull();
        expect(screen.getByTestId('draw-bag-count').textContent).toBe('3');
        expect(screen.queryByText('Draw Pile')).toBeNull();
    });

    it('renders DiscardFaceUp as a visible zone with tiles', () => {
        ensureResizeObserver();
        render(
            <GameLayout
                G={createState()}
                ctx={baseCtx}
                moves={{}}
                playerID={'0'}
                isActive={false}
            />
        );

        expect(screen.getByText('Discard (Face Up)')).not.toBeNull();
        expect(screen.getByText(TileType.Committee)).not.toBeNull();
    });
});

