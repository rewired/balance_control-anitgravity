import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import type { InteractionController, InteractionActionMode } from '../ui/interaction/types';
import { MeasureTray } from './MeasureTray';
import { groupFormalizeIntents } from '../ui/interaction/formalizeHelpers';
import { groupConvertIntents } from '../ui/interaction/convertHelpers';

interface ActionDockProps {
    isActive: boolean;
    G: GameState;
    controller: InteractionController;
}

const STAGE_LABELS: Record<string, string> = {
    drawAndPlace: 'Draw & Place',
    politicalAction: 'Political Action'
};

const formatIntentLabel = (intent: LegalIntent) => {
    if (intent.moveType === 'moveInfluence') {
        return `Move Influence ${intent.payload?.sourceId} → ${intent.payload?.targetId}`;
    }
    if (intent.moveType === 'formalizeInfluence') {
        return `Formalize ${intent.payload?.tileId}`;
    }
    if (intent.moveType === 'convertResources') {
        return `Convert → ${intent.payload?.outputResort}`;
    }
    if (intent.moveType.endsWith('.takeMeasure')) {
        return `Take Measure ${intent.payload}`;
    }
    if (intent.moveType === 'passTilePlacement') {
        return 'Skip placement';
    }
    return intent.moveType;
};

const intentSortKey = (intent: LegalIntent) => {
    const payloadKey = JSON.stringify(intent.payload ?? {});
    return `${intent.moveType}:${payloadKey}`;
};

const getActionLabel = (mode: InteractionActionMode, draftIntent: LegalIntent | null) => {
    if (draftIntent) return formatIntentLabel(draftIntent);
    switch (mode) {
        case 'placeInfluence': return 'Place Influence';
        case 'moveInfluence': return 'Move Influence';
        case 'formalizeInfluence': return 'Formalize Influence';
        case 'convertResources': return 'Convert Resources';
        case 'takeMeasure': return 'Take Measure';
        default: return 'Choose action';
    }
};

const getStepLabel = (state: string, mode: InteractionActionMode, moveInfluenceSourceId: string | null) => {
    if (state === 'draftReady') return 'Preview';
    if (state === 'selectingParams') {
        if (mode === 'moveInfluence' && !moveInfluenceSourceId) return 'Select source';
        if (mode === 'moveInfluence' && moveInfluenceSourceId) return 'Select destination';
        if (mode === 'placeInfluence') return 'Select target';
        if (mode === 'formalizeInfluence') return 'Select committee';
        if (mode === 'convertResources') return 'Select grassroots';
        if (mode === 'takeMeasure') return 'Select measure';
        return 'Select parameters';
    }
    if (state === 'selectingVariant') return 'Select variant';
    return 'Select action';
};

const VariantSelectionPanel: React.FC<{ controller: InteractionController }> = ({ controller }) => {
    const {
        interactionState,
        pinnedCommitteeTileId,
        pinnedGrassrootsTileId,
        proposeIntent,
        vm
    } = controller;

    if (interactionState !== 'selectingVariant') return null;

    if (pinnedCommitteeTileId) {
        const groupsMap = groupFormalizeIntents(vm.intents);
        const groups = groupsMap.get(pinnedCommitteeTileId) || [];

        return (
            <div className="variant-selection-panel" data-testid="variant-selection-panel">
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Select Payment</div>
                {groups.map(group => (
                    <div key={group.paymentKey} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Pay: {group.paymentResourceIds.join(', ') || 'Free'}
                        </div>
                        {group.variants.map(variant => (
                            <button
                                key={intentSortKey(variant)}
                                className="btn-secondary btn-small"
                                onClick={() => proposeIntent(variant)}
                                style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
                                data-testid={`btn-variant-${variant.payload?.extraResourceIds?.join('-') || 'base'}`}
                            >
                                {variant.payload?.extraResourceIds && variant.payload.extraResourceIds.length > 0
                                    ? `Extra: ${variant.payload.extraResourceIds.join(', ')}`
                                    : 'Standard'}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (pinnedGrassrootsTileId) {
        const groupsMap = groupConvertIntents(vm.intents);
        const tileGroup = groupsMap.get(pinnedGrassrootsTileId);

        if (!tileGroup) return <div data-testid="no-variants">No variants available</div>;

        return (
            <div className="variant-selection-panel" data-testid="variant-selection-panel">
                {tileGroup.outputs.map(outputGroup => (
                    <div key={outputGroup.outputResort} style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            To: {outputGroup.outputResort}
                        </div>
                        {outputGroup.combos.map(combo => (
                            <div key={combo.inputKey} style={{ marginLeft: '8px', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    From: {combo.inputResourceIds.join(', ')}
                                </div>
                                {combo.variants.map(variant => (
                                    <button
                                        key={intentSortKey(variant)}
                                        className="btn-secondary btn-small"
                                        onClick={() => proposeIntent(variant)}
                                        style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
                                        data-testid={`btn-variant-${variant.payload?.outputResort}-${combo.inputKey}`}
                                    >
                                        Select
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

const CurrentActionPanel: React.FC<{ controller: InteractionController }> = ({ controller }) => {
    const {
        actionMode,
        interactionState,
        draft,
        moveInfluenceSourceId,
        pinnedCommitteeTileId,
        pinnedGrassrootsTileId,
        confirmDraft,
        cancelDraft,
        editDraftParams,
        editDraftVariant
    } = controller;

    const actionLabel = getActionLabel(actionMode, draft.intent);
    const stepLabel = getStepLabel(interactionState, actionMode, moveInfluenceSourceId);

    return (
        <div className="current-action-panel" data-testid="current-action-panel" style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <div className="action-status-block">
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Action</div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{actionLabel}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Step</div>
                <div style={{ fontWeight: 'bold' }}>{stepLabel}</div>
                {moveInfluenceSourceId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Source: </span>
                        {moveInfluenceSourceId}
                    </div>
                )}
                {pinnedCommitteeTileId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Committee: </span>
                        {pinnedCommitteeTileId}
                    </div>
                )}
                {pinnedGrassrootsTileId && (
                    <div className="pinned-params" style={{ marginTop: '4px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Grassroots: </span>
                        {pinnedGrassrootsTileId}
                    </div>
                )}
            </div>

            {interactionState === 'draftReady' && draft.intent && (
                <div className="action-panel-draft" data-testid="action-dock-draft" style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        {draft.intent.moveType === 'placeTile' && (
                            <button className="btn-secondary btn-small" onClick={editDraftParams} data-testid="btn-edit-placement">
                                Change placement
                            </button>
                        )}
                        {draft.intent.moveType === 'placeInfluence' && (
                            <button className="btn-secondary btn-small" onClick={editDraftParams} data-testid="btn-edit-target">
                                Change target
                            </button>
                        )}
                        {draft.intent.moveType === 'moveInfluence' && (
                            <button className="btn-secondary btn-small" onClick={editDraftParams} data-testid="btn-edit-target">
                                Change target
                            </button>
                        )}
                        {(draft.intent.moveType === 'formalizeInfluence' || draft.intent.moveType === 'convertResources') && (
                            <button className="btn-secondary btn-small" onClick={editDraftVariant} data-testid="btn-edit-selection">
                                Change selection
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-primary btn-small"
                            onClick={confirmDraft}
                            data-testid="btn-confirm-draft"
                        >
                            Confirm
                        </button>
                        <button
                            className="btn-secondary btn-small"
                            onClick={cancelDraft}
                            data-testid="btn-cancel-draft"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActionGroupList: React.FC<{ G: GameState; controller: InteractionController }> = ({ G, controller }) => {
    const { vm, actionMode, setActionMode, proposeIntent } = controller;

    const hasPlaceInfluenceIntents = vm.intents.some(i => i.moveType === 'placeInfluence');
    const hasMoveInfluenceIntents = vm.intents.some(i => i.moveType === 'moveInfluence');
    const hasFormalizeInfluenceIntents = vm.political.formalizeInfluence.length > 0;
    const hasConvertResourcesIntents = vm.political.convertResources.length > 0;
    const showMoreActions = vm.political.others.length > 0;

    return (
        <div className="action-group-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="action-group">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Influence</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className={actionMode === 'placeInfluence' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasPlaceInfluenceIntents}
                        onClick={() => setActionMode(actionMode === 'placeInfluence' ? 'none' : 'placeInfluence')}
                        data-testid="btn-mode-place-influence"
                    >
                        Place Influence
                    </button>
                    <button
                        className={actionMode === 'moveInfluence' ? 'btn-primary' : 'btn-secondary'}
                        disabled={!hasMoveInfluenceIntents}
                        onClick={() => setActionMode(actionMode === 'moveInfluence' ? 'none' : 'moveInfluence')}
                        data-testid="btn-mode-move-influence"
                    >
                        Move Influence
                    </button>
                </div>
            </div>

            <div className="action-group">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Committees</h4>
                <button
                    className={actionMode === 'formalizeInfluence' ? 'btn-primary' : 'btn-secondary'}
                    disabled={!hasFormalizeInfluenceIntents}
                    onClick={() => setActionMode(actionMode === 'formalizeInfluence' ? 'none' : 'formalizeInfluence')}
                    data-testid="btn-mode-formalize-influence"
                >
                    Formalize Influence
                </button>
            </div>

            <div className="action-group">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Economy</h4>
                <button
                    className={actionMode === 'convertResources' ? 'btn-primary' : 'btn-secondary'}
                    disabled={!hasConvertResourcesIntents}
                    onClick={() => setActionMode(actionMode === 'convertResources' ? 'none' : 'convertResources')}
                    data-testid="btn-mode-convert-resources"
                >
                    Convert Resources
                </button>
            </div>

            {vm.political.measures.length > 0 && (
                <div className="action-group">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Measures</h4>
                    <button
                        className={actionMode === 'takeMeasure' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setActionMode(actionMode === 'takeMeasure' ? 'none' : 'takeMeasure')}
                        data-testid="btn-mode-take-measure"
                    >
                        Take Measure
                    </button>
                    {actionMode === 'takeMeasure' && (
                        <MeasureTray
                            G={G}
                            intents={vm.political.measures}
                            onSelect={proposeIntent}
                        />
                    )}
                </div>
            )}

            {showMoreActions && (
                <div className="action-group">
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Expansions → Other</h4>
                    <div className="action-panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {vm.political.others.map(intent => (
                            <button
                                key={intentSortKey(intent)}
                                className="btn-secondary"
                                onClick={() => proposeIntent(intent)}
                                style={{ textAlign: 'left' }}
                            >
                                {formatIntentLabel(intent)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const ActionDock: React.FC<ActionDockProps> = ({
    isActive,
    G,
    controller
}) => {
    if (!isActive) return null;

    const {
        vm,
        proposeIntent,
        interactionState
    } = controller;

    const stageLabel = vm.stage ? (STAGE_LABELS[vm.stage] ?? vm.stage) : 'Waiting';
    const isDrawAndPlace = vm.stage === 'drawAndPlace';
    const isPoliticalAction = vm.stage === 'politicalAction';

    return (
        <div className="action-panel action-dock" data-testid="action-dock">
            <div className="action-panel-header">
                <div className="action-panel-title">Actions</div>
                <div className="action-panel-stage">{stageLabel}</div>
            </div>

            <CurrentActionPanel controller={controller} />

            {interactionState === 'selectingVariant' ? (
                <VariantSelectionPanel controller={controller} />
            ) : (
                interactionState !== 'draftReady' && (
                    <>
                        {isDrawAndPlace && (
                            <div className="action-panel-primary">
                            <div className="action-panel-meta">Staged: {vm.stagedTileId || 'None'}</div>
                            {vm.drawAndPlace.passTilePlacement && (
                                <button
                                    className="btn-primary"
                                    onClick={() => proposeIntent(vm.drawAndPlace.passTilePlacement!)}
                                    data-testid="btn-skip-placement"
                                >
                                    Skip placement
                                </button>
                            )}
                        </div>
                    )}
                    {isPoliticalAction && (
                        <ActionGroupList G={G} controller={controller} />
                    )}
                </>
            ))}
        </div>
    );
};
