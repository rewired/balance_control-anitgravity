import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from '../src/components/Controls';
import { TileType } from '@balance-control/rules';

describe('Controls - StartCommittee targeting', () => {
    it('disables PlaceInfluence when selected tile is StartCommittee', () => {
        const moves = {
            placeInfluence: vi.fn(),
            pass: vi.fn(),
            passTilePlacement: vi.fn()
        };
        const ctx = { currentPlayer: '0', activePlayers: { '0': 'politicalAction' } };
        const G: any = {
            tiles: {
                tile_start_committee: { id: 'tile_start_committee', type: TileType.StartCommittee }
            },
            zones: {},
            grid: { '0,0': 'tile_start_committee' },
            objects: {},
            adjacency: {},
            engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
        };

        render(
            <Controls
                moves={moves}
                ctx={ctx}
                events={{}}
                G={G}
                playerID={'0'}
                isActive={true}
                stage={'politicalAction'}
                selectedTileId={'tile_start_committee'}
            />
        );

        const btn = screen.getByTestId('btn-place-influence') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
        fireEvent.click(btn);
        expect(moves.placeInfluence).not.toHaveBeenCalled();
    });
});
