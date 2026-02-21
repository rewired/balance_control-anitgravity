import React from 'react';
import { InteractionController } from '../ui/interaction/types';
import { useT } from '../ui/i18n';

interface InspectorActionStatusProps {
    controller: InteractionController;
}

/**
 * Read-only status block for the Inspector.
 * Shows active action, current step, and pinned parameters.
 * @see ARCH-06 Inspector responsibilities
 */
export const InspectorActionStatus: React.FC<InspectorActionStatusProps> = ({ controller }) => {
    const t = useT();
    const { 
        actionMode, 
        interactionState, 
        moveInfluenceSourceId, 
        pinnedCommitteeTileId, 
        pinnedGrassrootsTileId,
        vm 
    } = controller;

    let activeActionLabel = t('core:inspector.none');
    let stepLabel = '';
    let pinnedLabel = '';
    let pinnedValue = '';

    // 1. Active Action
    switch (actionMode) {
        case 'placeInfluence': activeActionLabel = t('core:action.placeInfluence'); break;
        case 'moveInfluence': activeActionLabel = t('core:action.moveInfluence'); break;
        case 'formalizeInfluence': activeActionLabel = t('core:action.formalize'); break;
        case 'convertResources': activeActionLabel = t('core:action.convert'); break;
        case 'takeMeasure': activeActionLabel = t('core:action.takeMeasure'); break;
        case 'none': activeActionLabel = t('core:inspector.none'); break;
    }

    // 2. Step
    if (vm.hasPendingChoice) {
         stepLabel = t('core:inspector.resolveChoice');
    } else {
        switch (interactionState) {
            case 'selectingAction':
                stepLabel = t('core:step.chooseAction');
                break;
            case 'selectingParams':
                if (actionMode === 'moveInfluence') {
                    if (!moveInfluenceSourceId) stepLabel = t('core:step.chooseSource');
                    else stepLabel = t('core:step.chooseDestination');
                } else if (actionMode === 'placeInfluence') {
                     stepLabel = t('core:step.chooseTile');
                } else if (actionMode === 'formalizeInfluence' || actionMode === 'convertResources') {
                     stepLabel = t('core:step.chooseTile');
                }
                break;
            case 'selectingVariant':
                stepLabel = t('core:step.chooseVariant');
                break;
            case 'draftReady':
                stepLabel = t('core:ui.confirm');
                break;
        }
    }
    
    // 3. Pinned Params
    if (actionMode === 'moveInfluence' && moveInfluenceSourceId) {
        pinnedLabel = t('core:inspector.pinnedSource');
        pinnedValue = moveInfluenceSourceId;
    } else if (actionMode === 'formalizeInfluence' && pinnedCommitteeTileId) {
        pinnedLabel = t('core:inspector.pinnedTile');
        pinnedValue = pinnedCommitteeTileId;
    } else if (actionMode === 'convertResources' && pinnedGrassrootsTileId) {
        pinnedLabel = t('core:inspector.pinnedTile');
        pinnedValue = pinnedGrassrootsTileId;
    }

    return (
        <div className="inspector-action-status" data-testid="inspector-action-status" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="inspector-row">
                <span className="inspector-label">{t('core:inspector.activeAction')}</span>
                <span className="inspector-value" data-testid="inspector-active-action">{activeActionLabel}</span>
            </div>
            {stepLabel && (
                <div className="inspector-row">
                    <span className="inspector-label">{t('core:inspector.step')}</span>
                    <span className="inspector-value" data-testid="inspector-step">{stepLabel}</span>
                </div>
            )}
            {pinnedLabel && (
                <div className="inspector-row">
                    <span className="inspector-label">{pinnedLabel}</span>
                    <span className="inspector-value" data-testid="inspector-pinned-value">{pinnedValue}</span>
                </div>
            )}
        </div>
    );
};
