import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ActionDock } from '../src/components/ActionDock';
import { buildIntentViewModel } from '../src/ui/useIntentViewModel';
import { I18nProvider } from '../src/ui/i18n';

afterEach(() => {
    cleanup();
});

const renderWithI18n = (ui: React.ReactElement) => {
    return render(
        <I18nProvider>
            {ui}
        </I18nProvider>
    );
};

describe('ActionDock', () => {
    it('shows Place Influence and Move Influence buttons in politicalAction', () => {
        const intents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } },
            { moveType: 'moveInfluence', payload: { sourceId: 'tile_alpha', targetId: 'tile_beta' } }
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByTestId('btn-mode-place-influence')).toBeDefined();
        expect(screen.getByTestId('btn-mode-move-influence')).toBeDefined();

        // Assertion for group header translation
        expect(screen.getByText('Influence')).toBeDefined();
    });

    it('highlights active mode button', () => {
        const intents = [
            { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } }
        ] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'placeInfluence',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingParams'
        } as any;

        renderWithI18n(
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
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents, G: { objects: {} } } as any;
        const controller = {
            vm,
            actionMode: 'placeInfluence',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingParams'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={vm.G}
                controller={controller}
            />
        );

        // Check for Current Action Panel elements (translated)
        expect(screen.getByText('Active action')).toBeDefined();

        const currentPanel = screen.getByTestId('current-action-panel');
        expect(screen.getByTestId('current-action-panel')).toBeDefined();
        expect(currentPanel.textContent).toContain('Place influence');

        expect(screen.getByText('Step')).toBeDefined();
        expect(screen.getByText('Select tile')).toBeDefined();
    });

    it('shows group headers', () => {
        const intents = [] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents, political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] } } as any;
        const controller = {
            vm,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByText('Influence')).toBeDefined();
        expect(screen.queryByText('Committees')).toBeNull();
        expect(screen.queryByText('Economy')).toBeNull();
    });

    it('proposes a secondary action exactly once', () => {
        const proposeIntent = vi.fn();
        const intents = [
            { moveType: 'unknownAction', payload: { foo: 'bar' } },
        ] as any;
        const G = { objects: {} } as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents, G } as any;
        const controller = {
            vm,
            proposeIntent,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        // Check for collapsible summary with count
        const summary = screen.getByTestId('summary-expansions-other');
        expect(summary).toBeDefined();
        expect(summary.textContent).toContain('Expansions (1)');

        // Open the details panel
        fireEvent.click(summary);

        // Click the action button
        const moveButton = screen.getByTestId('btn-other-unknownAction');
        fireEvent.click(moveButton);

        expect(proposeIntent).toHaveBeenCalledTimes(1);
        expect(proposeIntent).toHaveBeenCalledWith(intents[0]);
    });

    it('shows confirmation UI in Current Action Panel when interactionState is draftReady', () => {
        const confirmDraft = vi.fn();
        const cancelDraft = vi.fn();
        const draftedIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } };
        const G = { objects: {} } as any;

        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: [],
                G
            },
            interactionState: 'draftReady',
            draft: { intent: draftedIntent, isLegalNow: true },
            confirmDraft,
            cancelDraft,
            actionMode: 'none'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        expect(screen.getByTestId('action-dock-draft')).toBeDefined();
        // Translated summary for placeInfluence
        expect(screen.getByText('target tile_alpha')).toBeDefined();
        expect(screen.getByText('Preview')).toBeDefined(); // Step label

        const confirmBtn = screen.getByTestId('btn-confirm-draft');
        expect(confirmBtn.textContent).toBe('Confirm');
        fireEvent.click(confirmBtn);
        expect(confirmDraft).toHaveBeenCalledTimes(1);

        const cancelBtn = screen.getByTestId('btn-cancel-draft');
        expect(cancelBtn.textContent).toBe('Cancel');
        fireEvent.click(cancelBtn);
        expect(cancelDraft).toHaveBeenCalledTimes(1);
    });

    it('shows Measures group and toggles MeasureTray', () => {
        const intents = [
            { moveType: 'exp01.takeMeasure', payload: 'm1' }
        ] as any;
        const G = {
            objects: {
                'm1': { type: 'Measure', measureId: 'Measure A' }
            }
        } as any;

        // Setup controller
        const setActionMode = vi.fn();
        const controller = {
            vm: {
                stage: 'politicalAction',
                political: {
                    others: [],
                    formalizeInfluence: [],
                    convertResources: [],
                    measures: intents
                },
                intents: intents,
                drawAndPlace: {},
                G
            },
            actionMode: 'none',
            setActionMode,
            proposeIntent: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        const { rerender } = renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        // Check for Measures group and button
        expect(screen.getByText('Measures')).toBeDefined();
        const button = screen.getByTestId('btn-mode-take-measure');
        expect(button).toBeDefined();

        // MeasureTray content should NOT be visible initially
        expect(screen.queryByText('Measure A')).toBeNull();

        // Click to toggle
        fireEvent.click(button);
        expect(setActionMode).toHaveBeenCalledWith('takeMeasure');

        // Re-render with active mode to simulate state update
        const activeController = { ...controller, actionMode: 'takeMeasure' };
        rerender(
            <I18nProvider>
                <ActionDock
                    isActive={true}
                    G={G}
                    controller={activeController}
                />
            </I18nProvider>
        );

        // Now MeasureTray content should be visible
        expect(screen.getByText('Measure A')).toBeDefined();
    });

    it('hides normal action buttons (group list) when interactionState is draftReady', () => {
        const G = { objects: {} } as any;
        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: [],
                G
            },
            interactionState: 'draftReady',
            draft: { intent: { moveType: 'foo' } },
            actionMode: 'none'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        expect(screen.queryByTestId('btn-mode-place-influence')).toBeNull();
        expect(screen.queryByText('Influence')).toBeNull();
        expect(screen.queryByText('Committees')).toBeNull();
    });

    it('shows edit controls when draft is ready (placeInfluence)', () => {
        const editDraftTarget = vi.fn();
        const draftedIntent = { moveType: 'placeInfluence', payload: { targetTileId: 'tile_alpha' } };
        const G = { objects: {} } as any;

        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: [],
                G
            },
            interactionState: 'draftReady',
            draft: { intent: draftedIntent },
            editDraftTarget,
            actionMode: 'placeInfluence'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        const editButton = screen.getByTestId('btn-edit-target');
        fireEvent.click(editButton);
        expect(editDraftTarget).toHaveBeenCalledTimes(1);
        expect(editButton.textContent).toBe('Change target');
    });

    it('shows variant selection panel for formalizeInfluence', () => {
        const intents = [
            {
                moveType: 'formalizeInfluence',
                payload: {
                    committeeTileId: 'tile-1',
                    paymentResourceIds: ['res-1'],
                    extraResourceIds: []
                }
            },
            {
                moveType: 'formalizeInfluence',
                payload: {
                    committeeTileId: 'tile-1',
                    paymentResourceIds: ['res-1'],
                    extraResourceIds: ['res-2']
                }
            }
        ];

        const G = { objects: {} } as any;

        // Mock vm manually since buildIntentViewModel might be complex
        const vm = {
            stage: 'politicalAction',
            intents,
            political: { others: [], formalizeInfluence: intents, convertResources: [], measures: [] },
            G
        } as any;

        const proposeIntent = vi.fn();

        const controller = {
            vm,
            actionMode: 'formalizeInfluence',
            interactionState: 'selectingVariant',
            pinnedCommitteeTileId: 'tile-1',
            proposeIntent,
            draft: { intent: null }
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        // Check panel exists
        expect(screen.getByTestId('variant-selection-panel')).toBeDefined();

        // Check for variants
        expect(screen.getByText('Select payment')).toBeDefined();
        // Check for payment info
        expect(screen.getByText('Pay: res-1')).toBeDefined();

        // Check for variant buttons
        const standardBtn = screen.getByTestId('btn-variant-base');
        expect(standardBtn).toBeDefined();
        expect(standardBtn.textContent).toContain('Standard');

        const extraBtn = screen.getByTestId('btn-variant-res-2');
        expect(extraBtn).toBeDefined();
        expect(extraBtn.textContent).toContain('Extra: res-2');

        // Test interaction
        fireEvent.click(standardBtn);
        expect(proposeIntent).toHaveBeenCalledWith(intents[0]);
    });

    it('shows variant selection panel for convertResources', () => {
        const intents = [
            {
                moveType: 'convertResources',
                payload: {
                    grassrootsTileId: 'T1',
                    outputResort: 'INF',
                    inputResourceIds: ['r1', 'r2']
                }
            }
        ];

        const G = { objects: {} } as any;

        const vm = {
            stage: 'politicalAction',
            intents,
            political: { others: [], formalizeInfluence: [], convertResources: intents, measures: [] },
            G
        } as any;

        const proposeIntent = vi.fn();

        const controller = {
            vm,
            actionMode: 'convertResources',
            interactionState: 'selectingVariant',
            pinnedGrassrootsTileId: 'T1',
            proposeIntent,
            draft: { intent: null }
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        expect(screen.getByTestId('variant-selection-panel')).toBeDefined();
        expect(screen.getByText('To: INF')).toBeDefined();
        expect(screen.getByText('From: r1, r2')).toBeDefined();

        const variantBtn = screen.getByTestId('btn-variant-INF-r1|r2');
        fireEvent.click(variantBtn);
        expect(proposeIntent).toHaveBeenCalledWith(intents[0]);
    });

    it('shows "Change selection" button when a measure is drafted', () => {
        const editDraftVariant = vi.fn();
        const draftedIntent = {
            moveType: 'exp01.takeMeasure',
            payload: 'measure-123'
        };

        const G = {
            objects: {
                'measure-123': { type: 'Measure', measureId: 'Measure A' }
            }
        } as any;

        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: [],
                G
            },
            interactionState: 'draftReady',
            draft: { intent: draftedIntent, isLegalNow: true },
            editDraftVariant: editDraftVariant,
            actionMode: 'takeMeasure',
            // Mock other required props
            confirmDraft: vi.fn(),
            cancelDraft: vi.fn(),
            editDraftSource: vi.fn(),
            editDraftDestination: vi.fn(),
            editDraftTarget: vi.fn(),
            moveInfluenceSourceId: null,
            pinnedCommitteeTileId: null,
            pinnedGrassrootsTileId: null,
            setActionMode: vi.fn(),
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        // Verify draft panel is shown
        expect(screen.getByTestId('action-dock-draft')).toBeDefined();

        // Verify intent label is shown
        expect(screen.getByText('Take measure Measure A')).toBeDefined();

        // Verify "Change selection" button exists and works
        const editButton = screen.getByTestId('btn-edit-selection');
        expect(editButton).toBeDefined();
        expect(editButton.textContent).toBe('Edit variant');

        fireEvent.click(editButton);
        expect(editDraftVariant).toHaveBeenCalledTimes(1);
    });

    it('shows "Change tile" button when in selectingVariant', () => {
        const editPinnedTile = vi.fn();
        const G = { objects: {} } as any;
        const controller = {
            vm: {
                stage: 'politicalAction',
                political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
                intents: [],
                G
            },
            interactionState: 'selectingVariant',
            pinnedCommitteeTileId: 'tile1',
            editPinnedTile,
            actionMode: 'formalizeInfluence',
            draft: { intent: null },
            // Mock other required props
            confirmDraft: vi.fn(),
            cancelDraft: vi.fn(),
            editDraftSource: vi.fn(),
            editDraftDestination: vi.fn(),
            editDraftTarget: vi.fn(),
            editDraftVariant: vi.fn(),
            moveInfluenceSourceId: null,
            pinnedGrassrootsTileId: null,
            setActionMode: vi.fn(),
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={G}
                controller={controller}
            />
        );

        const changeTileBtn = screen.getByTestId('btn-change-tile');
        expect(changeTileBtn).toBeDefined();
        expect(changeTileBtn.textContent).toBe('Change tile');

        fireEvent.click(changeTileBtn);
        expect(editPinnedTile).toHaveBeenCalledTimes(1);
    });

    it('uses German translations when locale is de', () => {
        // Mock window.location.search
        const originalLocation = window.location;
        // @ts-ignore
        delete window.location;
        window.location = { ...originalLocation, search: '?lang=de' };

        const intents = [] as any;
        const vm = { ...buildIntentViewModel({ ctx: { activePlayers: { '0': 'politicalAction' } }, playerID: '0', intents, selectedTileId: null, stagedTileId: null, pendingChoiceKind: null }), intents } as any;
        const controller = {
            vm,
            actionMode: 'none',
            setActionMode: vi.fn(),
            intents: intents,
            draft: { intent: null },
            interactionState: 'selectingAction'
        } as any;

        renderWithI18n(
            <ActionDock
                isActive={true}
                G={{} as any}
                controller={controller}
            />
        );

        expect(screen.getByText('Einfluss')).toBeDefined(); // German for Influence
        expect(screen.getByText('Aktionen')).toBeDefined(); // German for Actions

        // Restore window.location
        window.location = originalLocation;
    });
});
