import React from 'react';
import type { LegalIntent } from '@balance-control/game';
import type { IntentViewModel } from '../ui/useIntentViewModel';

interface ActionPanelProps {
    moves: any;
    isActive: boolean;
    vm: IntentViewModel;
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
    if (intent.moveType === 'passTilePlacement') {
        return 'Skip placement';
    }
    return intent.moveType;
};

const intentSortKey = (intent: LegalIntent) => {
    const payloadKey = JSON.stringify(intent.payload ?? {});
    return `${intent.moveType}:${payloadKey}`;
};

export const ActionPanel: React.FC<ActionPanelProps> = ({
    moves,
    isActive,
    vm
}) => {
    if (!isActive) return null;

    const stageLabel = vm.stage ? (STAGE_LABELS[vm.stage] ?? vm.stage) : 'Waiting';
    const isDrawAndPlace = vm.stage === 'drawAndPlace';
    const isPoliticalAction = vm.stage === 'politicalAction';

    const placeInfluenceForSelected = vm.political.placeInfluenceForSelected;
    const primaryPlaceInfluenceDisabled = !placeInfluenceForSelected;
    const showMoreActions = vm.political.others.length > 0;

    return (
        <div className="action-panel">
            <div className="action-panel-header">
                <div className="action-panel-title">Actions</div>
                <div className="action-panel-stage">{stageLabel}</div>
            </div>

            <div className="action-panel-primary">
                {isDrawAndPlace && (
                    <>
                        <div className="action-panel-meta">Staged: {vm.stagedTileId || 'None'}</div>
                        {vm.drawAndPlace.passTilePlacement && (
                            <button
                                className="btn-primary"
                                onClick={() => moves[vm.drawAndPlace.passTilePlacement!.moveType](vm.drawAndPlace.passTilePlacement!.payload)}
                                data-testid="btn-skip-placement"
                            >
                                Skip placement
                            </button>
                        )}
                    </>
                )}
                {isPoliticalAction && (
                    <>
                        <button
                            className="btn-primary"
                            disabled={primaryPlaceInfluenceDisabled}
                            onClick={
                                placeInfluenceForSelected
                                    ? () => moves[placeInfluenceForSelected.moveType](placeInfluenceForSelected.payload)
                                    : undefined
                            }
                            data-testid="btn-place-influence"
                        >
                            Place influence
                        </button>
                        {!vm.selectedTileId && (
                            <div className="action-panel-hint">Select a tile to place influence.</div>
                        )}
                        {vm.selectedTileId && primaryPlaceInfluenceDisabled && (
                            <div className="action-panel-hint">Selected tile is not a legal target.</div>
                        )}
                    </>
                )}
            </div>

            {showMoreActions && (
                <details className="action-panel-more">
                    <summary>More actions</summary>
                    <div className="action-panel-secondary">
                        {vm.political.others.map(intent => (
                            <button
                                key={intentSortKey(intent)}
                                className="btn-secondary"
                                onClick={() => moves[intent.moveType](intent.payload)}
                            >
                                {formatIntentLabel(intent)}
                            </button>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
};
