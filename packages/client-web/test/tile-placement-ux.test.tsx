import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { HexBoard } from '../src/components/HexBoard';

describe('HexBoard UX', () => {
    it('handles resolveChoice intents with spatial selection', () => {
        const moves = { resolveChoice: vi.fn() };
        // Intent is resolveChoice but payload has selection as coord string
        const intents = [
            { moveType: 'resolveChoice', payload: { choiceId: 'c1', selection: '1,0' } }
        ];
        const G = {
            grid: {},
            tiles: {},
            zones: {},
            objects: {},
            adjacency: {},
        } as any;

        render(
            <HexBoard
                G={G}
                moves={moves}
                placeTileIntents={intents as any}
                ghostCoords={['1,0']}
                isInteractive={true}
            />
        );

        const ghost = screen.getByTestId('hex-ghost-1_0');
        expect(ghost).toBeDefined();

        fireEvent.click(ghost);
        expect(moves.resolveChoice).toHaveBeenCalledTimes(1);
        expect(moves.resolveChoice).toHaveBeenCalledWith({ choiceId: 'c1', selection: '1,0' });
    });

    it('renders ghost preview on hover when pendingTile is provided', () => {
        const moves = { placeTile: vi.fn() };
        const intents = [
            { moveType: 'placeTile', payload: { targetCoord: '0,1' } }
        ];
        const G = {
            grid: {},
            tiles: {},
            zones: {},
            objects: {},
            adjacency: {},
        } as any;
        const pendingTile = { id: 't1', type: TileType.Resort, resort: 'ECO', weight: 2 };

        const { container } = render(
            <HexBoard
                G={G}
                moves={moves}
                placeTileIntents={intents as any}
                ghostCoords={['0,1']}
                isInteractive={true}
                pendingTile={pendingTile as any}
            />
        );

        const ghost = screen.getByTestId('hex-ghost-0_1');

        // Initially no preview
        expect(container.querySelector('.ghost-preview')).toBeNull();

        // Hover
        fireEvent.mouseEnter(ghost);

        // Should have preview
        const preview = container.querySelector('.ghost-preview');
        expect(preview).not.toBeNull();
    });
});
