import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { Tile } from '../src/components/Tile';
import { Token } from '../src/components/Token';
import { HexBoard } from '../src/components/HexBoard';

const baseG = {
    zones: {
        tile_alpha: { id: 'tile_alpha', name: 'Tile', items: [] }
    },
    tiles: {
        tile_alpha: { id: 'tile_alpha', type: TileType.Resort, weight: 1, resort: 'DOM' }
    },
    objects: {},
    adjacency: {},
} as any;

describe('Tile', () => {
    it('adds tile-selected when selected', () => {
        const { container } = render(
            <Tile tileId="tile_alpha" G={baseG} selected={true} testId="tile" />
        );
        expect((container.firstChild as HTMLElement).className).toContain('tile-selected');
    });

    it('adds tile-disabled when disabled', () => {
        const { container } = render(
            <Tile tileId="tile_alpha" G={baseG} disabled={true} testId="tile" />
        );
        expect((container.firstChild as HTMLElement).className).toContain('tile-disabled');
    });

    it('adds tile-clickable only when onClick is set and not disabled', () => {
        const { container, rerender } = render(
            <Tile tileId="tile_alpha" G={baseG} onClick={() => undefined} testId="tile" />
        );
        expect((container.firstChild as HTMLElement).className).toContain('tile-clickable');

        rerender(
            <Tile tileId="tile_alpha" G={baseG} onClick={() => undefined} disabled={true} testId="tile" />
        );
        expect((container.firstChild as HTMLElement).className).not.toContain('tile-clickable');
    });
});

describe('Token', () => {
    it('adds resource-inf for INF resources', () => {
        const { container } = render(
            <Token object={{ id: 'res_inf_1', type: 'Resource', resort: 'INF' } as any} />
        );
        expect((container.firstChild as HTMLElement).className).toContain('resource-inf');
    });

    it('adds resource-sec and resource-clm for SEC/CLM resources', () => {
        const { container, rerender } = render(
            <Token object={{ id: 'res_sec_1', type: 'Resource', resort: 'SEC' } as any} />
        );
        expect((container.firstChild as HTMLElement).className).toContain('resource-sec');

        rerender(
            <Token object={{ id: 'res_clm_1', type: 'Resource', resort: 'CLM' } as any} />
        );
        expect((container.firstChild as HTMLElement).className).toContain('resource-clm');
    });

    it('adds resource-unknown for unknown resorts', () => {
        const { container } = render(
            <Token object={{ id: 'res_unknown_1', type: 'Resource', resort: '???' } as any} />
        );
        expect((container.firstChild as HTMLElement).className).toContain('resource-unknown');
    });
});

describe('HexBoard', () => {
    it('proposes placeTile when a ghost is clicked', () => {
        const onProposeMove = vi.fn();
        const placeTileIntents = [
            { moveType: 'placeTile', payload: { targetCoord: '0,1' } }
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
                placeTileIntents={placeTileIntents as any}
                ghostCoords={['0,1']}
                isInteractive={true}
            />
        );

        const ghost = screen.getByTestId('hex-ghost-0_1');
        fireEvent.click(ghost);
        expect(onProposeMove).toHaveBeenCalledTimes(1);
        expect(onProposeMove).toHaveBeenCalledWith(placeTileIntents[0]);
    });

    it('proposes placeInfluence when a valid target is clicked in placeInfluence mode', () => {
        const onProposeMove = vi.fn();
        const placeInfluenceIntents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } }
        ];
        const G = {
            grid: { '0,0': 'tile_alpha' },
            tiles: { tile_alpha: { id: 'tile_alpha', resort: 'DOM', type: 'Resort' } },
            zones: { tile_alpha: { items: [] } },
            objects: {},
            adjacency: {},
        } as any;

        render(
            <HexBoard
                G={G}
                onProposeMove={onProposeMove}
                placeTileIntents={[]}
                placeInfluenceIntents={placeInfluenceIntents as any}
                actionMode="placeInfluence"
                ghostCoords={[]}
                isInteractive={true}
            />
        );

        const tile = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tile);
        expect(onProposeMove).toHaveBeenCalledTimes(1);
        expect(onProposeMove).toHaveBeenCalledWith(placeInfluenceIntents[0]);
    });
});
