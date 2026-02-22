import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { HexBoard } from '../src/components/HexBoard';
import type { GameState } from '@balance-control/rules';

afterEach(() => {
    cleanup();
});

// Minimal mock state
const mockG: GameState = {
    grid: {
        '0,0': 'tile-1',
        '1,0': 'tile-2', // Adjacent to 0,0
    },
    tiles: {
        'tile-1': { id: 'tile-1', type: 'Residential', weight: 1 },
        'tile-2': { id: 'tile-2', type: 'Industrial', weight: 1 },
    },
    zones: {
        'tile-1': { id: 'tile-1', items: [] },
        'tile-2': { id: 'tile-2', items: [] },
    },
    objects: {},
    players: {},
    phase: 'main',
    turn: 1,
    activePlayer: '0',
    matchConfig: {
        seed: 'test',
        expansions: {
            EXP_01_ECONOMY: false,
            EXP_02_SECURITY: false,
            EXP_03_CLIMATE: false,
        }
    },
    // Add missing required properties for GameState
    adjacency: {
        'tile-1': ['tile-2'],
        'tile-2': ['tile-1'],
    },
    globalResources: {},
    globalParameters: {},
    score: {},
    history: [],
    rngState: {},
} as unknown as GameState;

describe('HexBoard Z-Index Stacking', () => {
    it('applies hex-cell-hovered class when hovering a tile', () => {
        render(
            <HexBoard
                G={mockG}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0"
            />
        );

        const tile1 = screen.getByTestId('hex-tile-0_0');
        const tile2 = screen.getByTestId('hex-tile-1_0');

        // Initial state: no hover class
        expect(tile1.className).not.toContain('hex-cell-hovered');
        expect(tile2.className).not.toContain('hex-cell-hovered');

        // Hover tile 1
        fireEvent.mouseEnter(tile1);

        // Tile 1 should have hover class
        expect(tile1.className).toContain('hex-cell-hovered');
        // Tile 2 should not
        expect(tile2.className).not.toContain('hex-cell-hovered');

        // Unhover tile 1
        fireEvent.mouseLeave(tile1);
        expect(tile1.className).not.toContain('hex-cell-hovered');
    });

    it('selected tile has hex-cell-selected class', () => {
        render(
            <HexBoard
                G={mockG}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0"
                selectedTileId="tile-1"
            />
        );

        const tile1 = screen.getByTestId('hex-tile-0_0');
        expect(tile1.className).toContain('hex-cell-selected');
    });

    it('hovered tile has hex-cell-hovered class even if selected', () => {
         render(
            <HexBoard
                G={mockG}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
                activePlayerId="0"
                selectedTileId="tile-1"
            />
        );

        const tile1 = screen.getByTestId('hex-tile-0_0');
        // Already selected
        expect(tile1.className).toContain('hex-cell-selected');

        // Hover it
        fireEvent.mouseEnter(tile1);
        expect(tile1.className).toContain('hex-cell-hovered');
    });
});
