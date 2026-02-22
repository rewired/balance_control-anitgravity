import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { HexBoard } from '../src/components/HexBoard';

describe('HexBoard Preview Overlay', () => {
    afterEach(() => {
        cleanup();
    });

    const G = {
        grid: { '0,0': 'tile_A', '1,0': 'tile_B' },
        tiles: {
            tile_A: { id: 'tile_A', resort: 'DOM', type: 'Resort' },
            tile_B: { id: 'tile_B', resort: 'FOR', type: 'Resort' }
        },
        zones: {
            tile_A: { items: [] },
            tile_B: { items: [] }
        },
        objects: {},
        adjacency: {},
    } as any;

    it('shows ghost preview when draftIntent is placeTile', () => {
        const draftIntent = { moveType: 'placeTile', payload: { targetCoord: '0,1' } };
        const pendingTile = { id: 'tile_new', resort: 'ECO', type: 'Resort', weight: 1 };

        const { container } = render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                ghostCoords={['0,1']}
                isInteractive={true}
                draftIntent={draftIntent as any}
                pendingTile={pendingTile as any}
            />
        );

        // Check for .hex-ghost-drafted class
        const ghost = container.querySelector('.hex-ghost-drafted');
        expect(ghost).toBeTruthy();

        // Check for preview content (opacity 0.9)
        const preview = container.querySelector('.ghost-preview');
        expect(preview).toBeTruthy();
        expect((preview as HTMLElement).style.opacity).toBe('0.9');
    });

    it('shows influence marker preview when draftIntent is placeInfluence', () => {
        const draftIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_A' } };

        const { container } = render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
                draftIntent={draftIntent as any}
                actionMode="placeInfluence"
            />
        );

        // Check for .hex-cell-drafted on tile_A
        const cell = screen.getByTestId('hex-tile-0_0');
        expect(cell.className).toContain('hex-cell-drafted');

        // Check for marker
        const marker = container.querySelector('.hex-preview-marker.influence');
        expect(marker).toBeTruthy();
    });

    it('shows source and destination markers when draftIntent is moveInfluence', () => {
        const draftIntent = {
            moveType: 'moveInfluence',
            payload: { sourceId: 'tile_A', targetId: 'tile_B' }
        };

        const { container } = render(
            <HexBoard
                G={G}
                placeTileIntents={[]}
                ghostCoords={[]}
                isInteractive={true}
                draftIntent={draftIntent as any}
                actionMode="moveInfluence"
            />
        );

        // Check for source marker on tile_A
        const sourceCell = screen.getByTestId('hex-tile-0_0').parentElement;
        expect(sourceCell?.querySelector('.hex-preview-marker.source')).toBeTruthy();

        // Check for destination marker on tile_B
        const destCell = screen.getByTestId('hex-tile-1_0').parentElement;
        expect(destCell?.querySelector('.hex-preview-marker.destination')).toBeTruthy();
    });

    it('freezes board interaction (no propose) when draftIntent is present', () => {
        const onProposeMove = vi.fn();
        const onSelectTile = vi.fn();
        const draftIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_A' } };

        // Even though intents exist, draftIntent should block proposal
        const placeInfluenceIntents = [
             { moveType: 'placeInfluence', payload: { targetTileId: 'tile_B' } }
        ];

        render(
            <HexBoard
                G={G}
                onProposeMove={onProposeMove}
                onSelectTile={onSelectTile}
                placeTileIntents={[]}
                placeInfluenceIntents={placeInfluenceIntents as any}
                actionMode="placeInfluence"
                ghostCoords={[]}
                isInteractive={true}
                canInspect={true}
                draftIntent={draftIntent as any}
            />
        );

        // Click on tile_B (which would be valid target if no draft)
        const tileB = screen.getByTestId('hex-tile-1_0');
        fireEvent.click(tileB);

        expect(onProposeMove).not.toHaveBeenCalled();
        expect(onSelectTile).toHaveBeenCalledWith('tile_B', '1,0');
    });

    it('freezes ghost interaction (no propose) when draftIntent is present', () => {
        const onProposeMove = vi.fn();
        const draftIntent = { moveType: 'placeTile', payload: { targetCoord: '0,1' } };
        const pendingTile = { id: 'tile_new', resort: 'ECO', type: 'Resort' };

        const placeTileIntents = [
            { moveType: 'placeTile', payload: { targetCoord: '0,2' } }
        ];

        render(
            <HexBoard
                G={G}
                onProposeMove={onProposeMove}
                placeTileIntents={placeTileIntents as any}
                ghostCoords={['0,1', '0,2']}
                isInteractive={true}
                draftIntent={draftIntent as any}
                pendingTile={pendingTile as any}
            />
        );

        // Click on other ghost
        const otherGhost = screen.getByTestId('hex-ghost-0_2');
        fireEvent.click(otherGhost);

        expect(onProposeMove).not.toHaveBeenCalled();
        expect(otherGhost).toHaveProperty('disabled', true);
    });
});
