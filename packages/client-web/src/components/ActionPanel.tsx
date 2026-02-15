import React, { useMemo } from 'react';
import type { LegalIntent } from '@balance-control/game';

interface ActionPanelProps {
    moves: any;
    isActive: boolean;
    stage?: string | null;
    intents: LegalIntent[];
    selectedTileId?: string | null;
    stagedTileId?: string | null;
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
    if (intent.moveType === 'pass') {
        return 'Pass';
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
    stage,
    intents,
    selectedTileId,
    stagedTileId
}) => {
    if (!isActive) return null;

    const stageLabel = stage ? (STAGE_LABELS[stage] ?? stage) : 'Waiting';
    const isDrawAndPlace = stage === 'drawAndPlace';
    const isPoliticalAction = stage === 'politicalAction';

    const placeInfluenceIntent = useMemo(() => {
        if (!selectedTileId) return null;
        return intents.find(intent => intent.moveType === 'placeInfluence' && intent.payload?.targetTileId === selectedTileId) || null;
    }, [intents, selectedTileId]);

    const passTilePlacementIntent = useMemo(() => {
        return intents.find(intent => intent.moveType === 'passTilePlacement') || null;
    }, [intents]);

    const secondaryIntents = useMemo(() => {
        const normalIntents = intents.filter(intent => {
            if (intent.moveType === 'resolveChoice') return false;
            if (intent.moveType === 'placeTile') return false;
            if (intent.moveType === 'placeInfluence') return false;
            if (intent.moveType === 'pass') return false;
            if (intent.moveType === 'passTilePlacement') return false;
            return true;
        });

        const grouped: Record<string, LegalIntent[]> = {};
        for (const intent of normalIntents) {
            if (!grouped[intent.moveType]) {
                grouped[intent.moveType] = [];
            }
            grouped[intent.moveType].push(intent);
        }

        const ordered: LegalIntent[] = [];
        const moveTypes = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        for (const moveType of moveTypes) {
            const group = grouped[moveType].slice().sort((a, b) => intentSortKey(a).localeCompare(intentSortKey(b)));
            ordered.push(...group);
        }

        const trailing: LegalIntent[] = [];
        if (!isDrawAndPlace) {
            const skipIntents = intents
                .filter(intent => intent.moveType === 'passTilePlacement')
                .slice()
                .sort((a, b) => intentSortKey(a).localeCompare(intentSortKey(b)));
            trailing.push(...skipIntents);
        }
        const passIntents = intents
            .filter(intent => intent.moveType === 'pass')
            .slice()
            .sort((a, b) => intentSortKey(a).localeCompare(intentSortKey(b)));
        trailing.push(...passIntents);

        return [...ordered, ...trailing];
    }, [intents, isDrawAndPlace]);

    const primaryPlaceInfluenceDisabled = !placeInfluenceIntent;
    const showMoreActions = secondaryIntents.length > 0;

    return (
        <div className="action-panel">
            <div className="action-panel-header">
                <div className="action-panel-title">Actions</div>
                <div className="action-panel-stage">{stageLabel}</div>
            </div>

            <div className="action-panel-primary">
                {isDrawAndPlace && (
                    <>
                        <div className="action-panel-meta">Staged: {stagedTileId || 'None'}</div>
                        {passTilePlacementIntent && (
                            <button
                                className="btn-primary"
                                onClick={() => moves[passTilePlacementIntent.moveType](passTilePlacementIntent.payload)}
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
                                placeInfluenceIntent
                                    ? () => moves[placeInfluenceIntent.moveType](placeInfluenceIntent.payload)
                                    : undefined
                            }
                            data-testid="btn-place-influence"
                        >
                            Place influence
                        </button>
                        {!selectedTileId && (
                            <div className="action-panel-hint">Select a tile to place influence.</div>
                        )}
                        {selectedTileId && primaryPlaceInfluenceDisabled && (
                            <div className="action-panel-hint">Selected tile is not a legal target.</div>
                        )}
                    </>
                )}
            </div>

            {showMoreActions && (
                <details className="action-panel-more">
                    <summary>More actions</summary>
                    <div className="action-panel-secondary">
                        {secondaryIntents.map(intent => (
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
