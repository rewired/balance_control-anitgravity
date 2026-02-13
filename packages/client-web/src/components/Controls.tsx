import React, { useMemo } from 'react';
import type { LegalIntent } from '@balance-control/game';

interface ControlsProps {
    moves: any;
    isActive: boolean;
    stage?: string | null;
    intents: LegalIntent[];
    selectedTileId?: string | null;
    stagedTileId?: string | null;
}

export const Controls: React.FC<ControlsProps> = ({
    moves,
    isActive,
    stage,
    intents,
    selectedTileId,
    stagedTileId
}) => {
    if (!isActive) return null;

    const isDrawAndPlace = stage === 'drawAndPlace';

    const placeInfluenceIntent = useMemo(() => {
        if (!selectedTileId) return null;
        return intents.find(intent => intent.moveType === 'placeInfluence' && intent.payload?.targetTileId === selectedTileId) || null;
    }, [intents, selectedTileId]);

    const passIntent = useMemo(() => intents.find(intent => intent.moveType === 'pass') || null, [intents]);
    const passTilePlacementIntent = useMemo(() => intents.find(intent => intent.moveType === 'passTilePlacement') || null, [intents]);

    const otherIntents = useMemo(() => {
        return intents.filter(intent => {
            if (intent.moveType === 'placeTile') return false;
            if (intent.moveType === 'placeInfluence') return intent.payload?.targetTileId === selectedTileId;
            if (intent.moveType === 'pass') return false;
            if (intent.moveType === 'passTilePlacement') return false;
            return true;
        });
    }, [intents, selectedTileId]);

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
        if (intent.moveType === 'resolveChoice') {
            return `Resolve Choice: ${String(intent.payload?.selection)}`;
        }
        if (intent.moveType === 'placeInfluence') {
            return `Place Influence ${intent.payload?.targetTileId}`;
        }
        return intent.moveType;
    };

    return (
        <div className="controls-bar">
            {isDrawAndPlace && (
                <span>Staged: {stagedTileId || 'None'}</span>
            )}
            {passTilePlacementIntent && (
                <button className="btn-secondary" onClick={() => moves[passTilePlacementIntent.moveType](passTilePlacementIntent.payload)}>
                    Skip Placement
                </button>
            )}
            {placeInfluenceIntent && (
                <button
                    className="btn-primary"
                    onClick={() => moves[placeInfluenceIntent.moveType](placeInfluenceIntent.payload)}
                    data-testid="btn-place-influence"
                >
                    Place Influence
                </button>
            )}
            {passIntent && (
                <button className="btn-secondary" onClick={() => moves[passIntent.moveType](passIntent.payload)}>Pass</button>
            )}
            {otherIntents.map(intent => (
                <button
                    key={`${intent.moveType}:${JSON.stringify(intent.payload)}`}
                    className="btn-secondary"
                    onClick={() => moves[intent.moveType](intent.payload)}
                >
                    {formatIntentLabel(intent)}
                </button>
            ))}
        </div>
    );
};
