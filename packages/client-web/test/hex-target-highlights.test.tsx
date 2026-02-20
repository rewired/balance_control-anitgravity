import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { HexBoard } from '../src/components/HexBoard';

afterEach(() => {
    cleanup();
});

describe('HexBoard Visual Affordances', () => {
    const G = {
        grid: { '0,0': 'tile_1', '1,0': 'tile_2', '0,1': 'tile_3' },
        tiles: {
            tile_1: { id: 'tile_1', resort: 'DOM', type: 'Resort' },
            tile_2: { id: 'tile_2', resort: 'DOM', type: 'Resort' },
            tile_3: { id: 'tile_3', resort: 'DOM', type: 'Resort' }
        },
        zones: {
            tile_1: { items: [] },
            tile_2: { items: [] },
            tile_3: { items: [] }
        },
        objects: {},
        adjacency: {},
    } as any;

    it('applies hex-cell-target to valid targets in placeInfluence mode', () => {
        const placeInfluenceIntents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_1' } }
        ];

        render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                placeInfluenceIntents={placeInfluenceIntents as any}
                actionMode="placeInfluence"
                ghostCoords={[]}
                isInteractive={true}
            />
        );

        const tile1 = screen.getByTestId('hex-tile-0_0');
        const tile2 = screen.getByTestId('hex-tile-1_0');

        expect(tile1.className).toContain('hex-cell-target');
        expect(tile1.className).not.toContain('hex-cell-target-destination');
        expect(tile2.className).not.toContain('hex-cell-target');
    });

    it('applies hex-cell-target-destination to valid targets in moveInfluence mode (destination step)', () => {
        const moveInfluenceIntents = [
            { moveType: 'moveInfluence', payload: { sourceId: 'tile_1', targetId: 'tile_2' } }
        ];

        render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                moveInfluenceIntents={moveInfluenceIntents as any}
                actionMode="moveInfluence"
                moveInfluenceSourceId="tile_1"
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0"
            />
        );

        const sourceTile = screen.getByTestId('hex-tile-0_0');
        const destTile = screen.getByTestId('hex-tile-1_0');
        const otherTile = screen.getByTestId('hex-tile-0_1');

        // Source is selected, not a target for itself
        expect(sourceTile.className).toContain('hex-cell-selected');
        expect(sourceTile.className).not.toContain('hex-cell-target');

        // Destination is a target AND a destination
        expect(destTile.className).toContain('hex-cell-target');
        expect(destTile.className).toContain('hex-cell-target-destination');

        // Other tile is neither
        expect(otherTile.className).not.toContain('hex-cell-target');
        expect(otherTile.className).not.toContain('hex-cell-target-destination');
    });

    it('does NOT apply hex-cell-target-destination in moveInfluence mode (source selection step)', () => {
        const moveInfluenceIntents = [
            { moveType: 'moveInfluence', payload: { sourceId: 'tile_1', targetId: 'tile_2' } }
        ];

        render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                moveInfluenceIntents={moveInfluenceIntents as any}
                actionMode="moveInfluence"
                moveInfluenceSourceId={null} // Source not yet selected
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0"
            />
        );

        const sourceTile = screen.getByTestId('hex-tile-0_0');
        
        // Source is a valid target for selection (source step), but NOT a destination
        expect(sourceTile.className).toContain('hex-cell-target');
        expect(sourceTile.className).not.toContain('hex-cell-target-destination');
    });

    it('passes active seat color as CSS variable for destination targets', () => {
        const moveInfluenceIntents = [
            { moveType: 'moveInfluence', payload: { sourceId: 'tile_1', targetId: 'tile_2' } }
        ];

        render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                moveInfluenceIntents={moveInfluenceIntents as any}
                actionMode="moveInfluence"
                moveInfluenceSourceId="tile_1"
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0" // Player 0 -> Seat 1
            />
        );

        const destTile = screen.getByTestId('hex-tile-1_0');
        expect(destTile.style.getPropertyValue('--active-seat-color')).toBe('var(--seat-1)');
    });
});
