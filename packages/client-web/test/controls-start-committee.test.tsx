import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionDock } from '../src/components/ActionDock';
import { buildIntentViewModel } from '../src/ui/useIntentViewModel';

describe('Controls - StartCommittee targeting', () => {
    it('disables Place Influence button when no placeInfluence intents are available', () => {
        const intents: any[] = [];
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: 'tile_start_committee', stagedTileId: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        render(
            <ActionDock
                isActive={true}
                controller={controller}
            />
        );

        const btn = screen.getByTestId('btn-mode-place-influence') as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });
});
