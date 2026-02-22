// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { HexBoard } from '../src/components/HexBoard';
import { describe, it, expect, afterEach } from 'vitest';

// Mock ResizeObserver
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

const createMockState = () => {
    return {
        grid: {
            '0,0': 'tile-1'
        },
        tiles: {
            'tile-1': {
                id: 'tile-1',
                type: 'Urban',
                weight: 2,
                resort: null
            }
        },
        zones: {
            'tile-1': {
                id: 'tile-1',
                items: ['inf-1', 'inf-2']
            }
        },
        objects: {
            'inf-1': { type: 'Influence', owner: '0' }, // Seat 1
            'inf-2': { type: 'Influence', owner: '1' }  // Seat 2
        },
        adjacency: {},
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

afterEach(() => {
    cleanup();
});

describe('BoardHoverCard', () => {
    it('shows hover card on mouse enter and removes title', () => {
        ensureResizeObserver();
        const G = createMockState();

        render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
            />
        );

        const tile = screen.getByTestId('hex-tile-0_0');

        // Check title is empty (to avoid browser tooltip)
        expect(tile.getAttribute('title')).toBe('');

        // Simulate hover
        fireEvent.mouseEnter(tile);

        // Check for hover card content
        const hoverCard = document.querySelector('.board-hover-card');
        expect(hoverCard).not.toBeNull();
        const card = within(hoverCard as HTMLElement);

        expect(card.getByText('Urban')).toBeDefined();
        expect(card.getByText('0,0')).toBeDefined();
        expect(card.getByText('Weight')).toBeDefined();
        // Check weight '2' specifically in the card
        expect(card.getByText('2')).toBeDefined();

        // Check influence breakdown
        expect(card.getByText('Influence')).toBeDefined();

        // We expect to see '1' twice (once for each seat)
        const counts = card.getAllByText('1');
        expect(counts.length).toBeGreaterThanOrEqual(2);

        // Simulate mouse leave
        fireEvent.mouseLeave(tile);

        // Hover card should disappear
        expect(document.querySelector('.board-hover-card')).toBeNull();
    });
});
