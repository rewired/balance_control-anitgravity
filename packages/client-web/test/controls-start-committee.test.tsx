import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionPanel } from '../src/components/ActionPanel';

describe('Controls - StartCommittee targeting', () => {
    it('disables PlaceInfluence when selected tile lacks a legal intent', () => {
        const moves = {
            placeInfluence: vi.fn(),
            pass: vi.fn(),
            passTilePlacement: vi.fn()
        };

        render(
            <ActionPanel
                moves={moves}
                isActive={true}
                stage={'politicalAction'}
                intents={[]}
                selectedTileId={'tile_start_committee'}
            />
        );

        const btn = screen.getByTestId('btn-place-influence') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
        fireEvent.click(btn);
        expect(moves.placeInfluence).not.toHaveBeenCalled();
    });
});
