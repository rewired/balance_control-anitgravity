import React from 'react';
import type { LegalIntent } from '@balance-control/game';

interface PendingChoiceModalProps {
    resolveChoiceIntents: LegalIntent[];
    onResolve: (intent: LegalIntent) => void;
}

const formatChoiceLabel = (intent: LegalIntent) => {
    const selection = intent.payload && (intent.payload as any).selection;
    if (selection === undefined) {
        return JSON.stringify(intent.payload ?? {});
    }
    if (typeof selection === 'string') return selection;
    if (typeof selection === 'number' || typeof selection === 'boolean') return String(selection);
    return JSON.stringify(selection);
};

const intentKey = (intent: LegalIntent) => JSON.stringify(intent.payload ?? {});

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const PendingChoiceModal: React.FC<PendingChoiceModalProps> = ({ resolveChoiceIntents, onResolve }) => {
    if (resolveChoiceIntents.length === 0) return null;

    return (
        <div className="pending-choice-overlay" data-testid="pending-choice-overlay">
            <div className="pending-choice-modal" role="dialog" aria-modal="true">
                <div className="pending-choice-title">Decision required</div>
                <div className="pending-choice-options">
                    {resolveChoiceIntents.map((intent, index) => (
                        <button
                            key={`${intentKey(intent)}:${index}`}
                            className="pending-choice-option"
                            type="button"
                            onClick={() => onResolve(intent)}
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
