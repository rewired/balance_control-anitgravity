import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ActionDock } from '../src/components/ActionDock';
import { buildIntentViewModel } from '../src/ui/useIntentViewModel';

afterEach(() => {
    cleanup();
});

describe('ActionDock', () => {
    it('shows Place Influence and Move Influence buttons in politicalAction', () => {
        const intents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } },
            { moveType: 'moveInfluence', payload: { sourceId: 'tile_alpha', targetId: 'tile_beta' } }
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null }), intents } as any;
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
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByTestId('btn-mode-place-influence')).toBeDefined();
        expect(screen.getByTestId('btn-mode-move-influence')).toBeDefined();
    });

    it('highlights active mode button', () => {
        const intents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } }
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'placeInfluence',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingParams'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        const button = screen.getByTestId('btn-mode-place-influence');
        expect(button.className).toContain('btn-primary');
    });

    it('shows Current Action Panel with step label when in placeInfluence mode', () => {
        const intents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } }
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'placeInfluence',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingParams'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        // Check for Current Action Panel elements
        expect(screen.getByText('Active Action')).toBeDefined();

        const currentPanel = screen.getByTestId('current-action-panel');
        // Use within to find text specifically inside the current panel
        expect(screen.getByTestId('current-action-panel')).toBeDefined();
        // Since getByText searches globally, verify that we can find the text somewhere,
        // but to avoid ambiguity error we can check if it's contained in the panel
        expect(currentPanel.textContent).toContain('Place Influence');

        expect(screen.getByText('Step')).toBeDefined();
        expect(screen.getByText('Select target')).toBeDefined();
    });

    it('shows group headers', () => {
        const intents = [] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null }), intents } as any;
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
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByText('Influence')).toBeDefined();
        expect(screen.getByText('Committees')).toBeDefined();
        expect(screen.getByText('Economy')).toBeDefined();
    });

    it('proposes a secondary action exactly once', () => {
        const proposeIntent = vi.fn();
        const intents = [
            { moveType: 'unknownAction', payload: { foo: 'bar' } },
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null }), intents } as any;
        const controller = {
            vm,
            proposeIntent,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByText('Expansions / Other')).toBeDefined();
        const moveButton = screen.getByText('unknownAction');
        fireEvent.click(moveButton);
        expect(proposeIntent).toHaveBeenCalledTimes(1);
        expect(proposeIntent).toHaveBeenCalledWith(intents[0]);
    });

    it('shows confirmation UI in Current Action Panel when interactionState is draftReady', () => {
        const confirmDraft = vi.fn();
        const cancelDraft = vi.fn();
        const draftedIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } };

        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: []
            },
            interactionState: 'draftReady',
            draft: { intent: draftedIntent },
            confirmDraft,
            cancelDraft,
            actionMode: 'none'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByTestId('action-dock-draft')).toBeDefined();
        expect(screen.getByText('placeInfluence')).toBeDefined();
        expect(screen.getByText('Preview')).toBeDefined(); // Step label

        fireEvent.click(screen.getByTestId('btn-confirm-draft'));
        expect(confirmDraft).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('btn-cancel-draft'));
        expect(cancelDraft).toHaveBeenCalledTimes(1);
    });

    it('hides normal action buttons (group list) when interactionState is draftReady', () => {
        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: []
            },
            interactionState: 'draftReady',
            draft: { intent: { moveType: 'foo' } },
            actionMode: 'none'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.queryByTestId('btn-mode-place-influence')).toBeNull();
        expect(screen.queryByText('Influence')).toBeNull();
        expect(screen.queryByText('Committees')).toBeNull();
    });

    it('shows edit controls when draft is ready (placeInfluence)', () => {
        const editDraftParams = vi.fn();
        const draftedIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } };

        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: []
            },
            interactionState: 'draftReady',
            draft: { intent: draftedIntent },
            editDraftParams,
            actionMode: 'placeInfluence'
        } as any;

        render(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        const editButton = screen.getByTestId('btn-edit-target');
        fireEvent.click(editButton);
        expect(editDraftParams).toHaveBeenCalledTimes(1);
    });
});
