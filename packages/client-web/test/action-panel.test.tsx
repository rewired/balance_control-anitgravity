import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ActionPanel } from '../src/components/ActionPanel';

afterEach(() => {
    cleanup();
});

describe('ActionPanel', () => {
    it('enables primary place influence when selection matches intent', () => {
        const moves = { placeInfluence: vi.fn() };
        render(
            <ActionPanel
                moves={moves}
                isActive={true}
                stage={'politicalAction'}
                intents={[{ moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } } as any]}
                selectedTileId={'tile_alpha'}
            />
        );

        const button = screen.getByTestId('btn-place-influence') as HTMLButtonElement;
        expect(button.disabled).toBe(false);
    });

    it('disables primary place influence without selection and does not dispatch', () => {
        const moves = { placeInfluence: vi.fn() };
        render(
            <ActionPanel
                moves={moves}
                isActive={true}
                stage={'politicalAction'}
                intents={[{ moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } } as any]}
                selectedTileId={null}
            />
        );

        const button = screen.getByTestId('btn-place-influence') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        fireEvent.click(button);
        expect(moves.placeInfluence).not.toHaveBeenCalled();
    });

    it('dispatches a secondary action exactly once', () => {
        const moves = { moveInfluence: vi.fn(), pass: vi.fn() };
        render(
            <ActionPanel
                moves={moves}
                isActive={true}
                stage={'politicalAction'}
                intents={[
                    { moveType: 'moveInfluence', payload: { sourceId: 'inf-1', targetId: 'inf-2' } },
                    { moveType: 'pass', payload: {} }
                ] as any}
                selectedTileId={'tile_alpha'}
            />
        );

        const summary = screen.getByText('More actions');
        fireEvent.click(summary);

        const moveButton = screen.getByText('Move Influence inf-1 → inf-2');
        fireEvent.click(moveButton);
        expect(moves.moveInfluence).toHaveBeenCalledTimes(1);
    });
});
