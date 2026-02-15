import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';

vi.mock('@balance-control/game', () => ({
    enumerateLegalIntents: () => []
}));

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
            tile_alpha: { id: 'tile_alpha', name: 'Tile', items: ['inf_1', 'inf_2', 'inf_3', 'res_1', 'res_2'] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: TileType.Resort, resort: 'FOR', weight: 3 }
        },
        objects: {
            inf_1: { id: 'inf_1', type: 'Influence', owner: 'player-0' },
            inf_2: { id: 'inf_2', type: 'Influence', owner: 'player-0' },
            inf_3: { id: 'inf_3', type: 'Influence', owner: 'player-1' },
            res_1: { id: 'res_1', type: 'Resource', resort: 'DOM' },
            res_2: { id: 'res_2', type: 'Resource', resort: 'INF' }
        },
        adjacency: {},
        grid: { '0,0': 'tile_alpha' },
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'drawAndPlace' } };

describe('Selection inspector', () => {
    it('updates inspector content when clicking an occupied tile', () => {
        ensureResizeObserver();
        const G = createState();
        render(
            <GameLayout
                G={G}
                ctx={baseCtx}
                moves={{}}
                playerID={'0'}
                isActive={true}
            />
        );

        const tileCell = screen.getByTestId('hex-tile-0_0');
        const tileNode = tileCell.querySelector('.tile') as HTMLElement;
        fireEvent.click(tileNode);

        const coordValue = screen.getByTestId('inspector-coord');
        expect(coordValue.textContent).toBe('0,0');

        const panel = screen.getByTestId('inspector-panel');
        expect(panel.textContent).toContain('player-0');

        const ownerLabel = screen.getByText('player-0');
        const ownerCount = ownerLabel.closest('.inspector-row')?.querySelector('.inspector-value');
        expect(ownerCount?.textContent).toBe('2');

        const resourceLabel = screen.getByText('DOM');
        const resourceCount = resourceLabel.closest('.inspector-row')?.querySelector('.inspector-value');
        expect(resourceCount?.textContent).toBe('1');
    });

    it('clears selection and inspector on Escape', () => {
        ensureResizeObserver();
        const G = createState();
        render(
            <GameLayout
                G={G}
                ctx={baseCtx}
                moves={{}}
                playerID={'0'}
                isActive={true}
            />
        );

        const tileCell = screen.getByTestId('hex-tile-0_0');
        const tileNode = tileCell.querySelector('.tile') as HTMLElement;
        fireEvent.click(tileNode);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByTestId('inspector-empty')).not.toBeNull();
    });
});
