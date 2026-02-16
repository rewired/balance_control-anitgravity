import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionPanel } from '../src/components/ActionPanel';
import { buildIntentViewModel } from '../src/ui/useIntentViewModel';

describe('Controls - StartCommittee targeting', () => {
    it('disables PlaceInfluence when selected tile lacks a legal intent', () => {
        const moves = {
            placeInfluence: vi.fn()
        };

        const intents: any[] = [];
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: 'tile_start_committee', stagedTileId: null }), intents } as any;

        render(
            <ActionPanel
                moves={moves}
                isActive={true}
                vm={vm}
            />
        );

        const btn = screen.getByTestId('btn-place-influence') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
        fireEvent.click(btn);
        expect(moves.placeInfluence).not.toHaveBeenCalled();
    });
});
