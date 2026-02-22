import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionDock } from '../src/components/ActionDock';
import { buildIntentViewModel } from '../src/ui/useIntentViewModel';
import { I18nProvider } from '../src/ui/i18n';

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
            <I18nProvider>
                <ActionDock
                    isActive={true}
                    controller={controller}
                />
            </I18nProvider>
        );

        const btn = screen.queryByTestId('btn-mode-place-influence');
        expect(btn).toBeNull();
    });
});
