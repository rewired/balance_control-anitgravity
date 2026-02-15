import React, { useMemo } from 'react';
import type { LegalIntent } from '@balance-control/game';

interface PendingChoiceModalProps {
    intents: LegalIntent[];
    moves: any;
}

const intentSortKey = (intent: LegalIntent) => {
    return JSON.stringify(intent.payload ?? {});
};

const formatChoiceLabel = (intent: LegalIntent) => {
    const selection = intent.payload && (intent.payload as any).selection;
    if (selection === undefined) {
        return JSON.stringify(intent.payload ?? {});
    }
    if (typeof selection === 'string') return selection;
    if (typeof selection === 'number' || typeof selection === 'boolean') return String(selection);
    return JSON.stringify(selection);
};

export const PendingChoiceModal: React.FC<PendingChoiceModalProps> = ({ intents, moves }) => {
    const resolveChoiceIntents = useMemo(() => {
        return intents
            .filter((intent) => intent.moveType === 'resolveChoice')
            .slice()
            .sort((a, b) => intentSortKey(a).localeCompare(intentSortKey(b)));
    }, [intents]);

    if (resolveChoiceIntents.length === 0) return null;

    return (
        <div className="pending-choice-overlay" data-testid="pending-choice-overlay">
            <div className="pending-choice-modal" role="dialog" aria-modal="true">
                <div className="pending-choice-title">Decision required</div>
                <div className="pending-choice-options">
                    {resolveChoiceIntents.map((intent, index) => (
                        <button
                            key={`${intentSortKey(intent)}:${index}`}
                            className="pending-choice-option"
                            type="button"
                            onClick={() => moves.resolveChoice(intent.payload)}
                            data-testid={`pending-choice-option-${index}`}
                        >
                            {formatChoiceLabel(intent)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
