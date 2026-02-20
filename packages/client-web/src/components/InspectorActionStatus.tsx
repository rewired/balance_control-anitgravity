import React from 'react';
import { InteractionController } from '../ui/interaction/types';

interface InspectorActionStatusProps {
    controller: InteractionController;
}

/**
 * Read-only status block for the Inspector.
 * Shows active action, current step, and pinned parameters.
 * @see ARCH-06 Inspector responsibilities
 */
export const InspectorActionStatus: React.FC<InspectorActionStatusProps> = ({ controller }) => {
    const { 
        actionMode, 
        interactionState, 
        moveInfluenceSourceId, 
        pinnedCommitteeTileId, 
        pinnedGrassrootsTileId,
        vm 
    } = controller;

    let activeActionLabel = 'None';
    let stepLabel = '';
    let pinnedLabel = '';
    let pinnedValue = '';

    // 1. Active Action
    switch (actionMode) {
        case 'placeInfluence': activeActionLabel = 'Place influence'; break;
        case 'moveInfluence': activeActionLabel = 'Move influence'; break;
        case 'formalizeInfluence': activeActionLabel = 'Formalize'; break;
        case 'convertResources': activeActionLabel = 'Convert'; break;
        case 'takeMeasure': activeActionLabel = 'Take measure'; break;
        case 'none': activeActionLabel = 'None'; break;
    }

    // 2. Step
    if (vm.hasPendingChoice) {
         stepLabel = 'Resolve choice';
    } else {
        switch (interactionState) {
            case 'selectingAction':
                stepLabel = 'Select action';
                break;
            case 'selectingParams':
                if (actionMode === 'moveInfluence') {
                    if (!moveInfluenceSourceId) stepLabel = 'Select source';
                    else stepLabel = 'Select destination';
                } else if (actionMode === 'placeInfluence') {
                     stepLabel = 'Select tile';
                } else if (actionMode === 'formalizeInfluence' || actionMode === 'convertResources') {
                     stepLabel = 'Select tile';
                }
                break;
            case 'selectingVariant':
                stepLabel = 'Select variant';
                break;
            case 'draftReady':
                stepLabel = 'Confirm';
                break;
        }
    }
    
    // 3. Pinned Params
    if (actionMode === 'moveInfluence' && moveInfluenceSourceId) {
        pinnedLabel = 'Pinned source';
        pinnedValue = moveInfluenceSourceId;
    } else if (actionMode === 'formalizeInfluence' && pinnedCommitteeTileId) {
        pinnedLabel = 'Pinned tile';
        pinnedValue = pinnedCommitteeTileId;
    } else if (actionMode === 'convertResources' && pinnedGrassrootsTileId) {
        pinnedLabel = 'Pinned tile';
        pinnedValue = pinnedGrassrootsTileId;
    }

    return (
        <div className="inspector-action-status" data-testid="inspector-action-status" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="inspector-row">
                <span className="inspector-label">Active action</span>
                <span className="inspector-value" data-testid="inspector-active-action">{activeActionLabel}</span>
            </div>
            {stepLabel && (
                <div className="inspector-row">
                    <span className="inspector-label">Step</span>
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
