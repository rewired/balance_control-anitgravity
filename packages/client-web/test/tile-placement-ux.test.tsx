import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { HexBoard } from '../src/components/HexBoard';

describe('HexBoard UX', () => {
    it('handles resolveChoice intents with spatial selection', () => {
        const onProposeMove = vi.fn();
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
                onProposeMove={onProposeMove}
                placeTileIntents={intents as any}
                ghostCoords={['1,0']}
                isInteractive={true}
            />
        );

        const ghost = screen.getByTestId('hex-ghost-1_0');
        expect(ghost).toBeDefined();

        fireEvent.click(ghost);
        expect(onProposeMove).toHaveBeenCalledTimes(1);
        expect(onProposeMove).toHaveBeenCalledWith(intents[0]);
    });

    it('renders ghost preview on hover when pendingTile is provided', () => {
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
        expect(preview?.querySelector('[data-component="HexTileVisual"]')).not.toBeNull();
    });

    it('renders Typed Grassroots ghost preview with correct typeTag', () => {
        const intents = [
            { moveType: 'placeTile', payload: { targetCoord: '0,2' } }
        ];
        const G = {
            grid: {},
            tiles: {},
            zones: {},
            objects: {},
            adjacency: {},
        } as any;

        // Typed Grassroots definition
        const pendingTile = {
            id: 't2',
            type: 'Grassroots',
            resort: 'DOM',
            conversion: { typedResort: 'DOM' }
        };

        const { container, getByText, getByTestId } = render(
            <HexBoard
                G={G}
                placeTileIntents={intents as any}
                ghostCoords={['0,2']}
                isInteractive={true}
                pendingTile={pendingTile as any}
            />
        );

        const ghost = getByTestId('hex-ghost-0_2');
        fireEvent.mouseEnter(ghost);

        const preview = container.querySelector('.ghost-preview');
        expect(preview).not.toBeNull();

        // Check for DOM tag text
        expect(getByText('DOM')).toBeDefined();
    });
});
