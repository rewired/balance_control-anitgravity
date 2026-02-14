import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { Tile } from '../src/components/Tile';
import { Token } from '../src/components/Token';

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
