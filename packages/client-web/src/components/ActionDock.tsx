import React from 'react';
import type { LegalIntent } from '@balance-control/game';
import type { InteractionController } from '../ui/interaction/types';

interface ActionDockProps {
    isActive: boolean;
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
    if (intent.moveType === 'passTilePlacement') {
        return 'Skip placement';
    }
    return intent.moveType;
};

const intentSortKey = (intent: LegalIntent) => {
    const payloadKey = JSON.stringify(intent.payload ?? {});
    return `${intent.moveType}:${payloadKey}`;
};

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const ActionDock: React.FC<ActionDockProps> = ({
    isActive,
    controller
}) => {
    if (!isActive) return null;

    const { vm, dispatchIntent, actionMode, setActionMode, moveInfluenceSourceId } = controller;

    const stageLabel = vm.stage ? (STAGE_LABELS[vm.stage] ?? vm.stage) : 'Waiting';
    const isDrawAndPlace = vm.stage === 'drawAndPlace';
    const isPoliticalAction = vm.stage === 'politicalAction';

    const showMoreActions = vm.political.others.length > 0;

    const hasPlaceInfluenceIntents = vm.intents.some(i => i.moveType === 'placeInfluence');
    const hasMoveInfluenceIntents = vm.intents.some(i => i.moveType === 'moveInfluence');

    return (
        <div className="action-panel action-dock" data-testid="action-dock">
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
                                onClick={() => dispatchIntent(vm.drawAndPlace.passTilePlacement!)}
                                data-testid="btn-skip-placement"
                            >
                                Skip placement
                            </button>
                        )}
                    </>
                )}
                {isPoliticalAction && (
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
                )}
            </div>

            {isPoliticalAction && actionMode === 'placeInfluence' && (
                <div className="action-panel-hint" style={{ marginTop: '8px', color: 'var(--accent-eco)' }}>
                    Select a target tile on the board to place influence.
                </div>
            )}

            {isPoliticalAction && actionMode === 'moveInfluence' && (
                <div className="action-panel-hint" style={{ marginTop: '8px', color: 'var(--accent-eco)' }}>
                    {!moveInfluenceSourceId
                        ? 'Select source tile on the board.'
                        : 'Select target tile on the board.'}
                </div>
            )}

            {showMoreActions && (
                <details className="action-panel-more">
                    <summary>More actions</summary>
                    <div className="action-panel-secondary">
                        {vm.political.others.map(intent => (
                            <button
                                key={intentSortKey(intent)}
                                className="btn-secondary"
                                onClick={() => dispatchIntent(intent)}
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
