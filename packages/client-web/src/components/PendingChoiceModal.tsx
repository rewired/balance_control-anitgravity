import React, { useState } from 'react';
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
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (resolveChoiceIntents.length === 0) return null;

    const handleConfirm = () => {
        if (selectedIndex !== null) {
            onResolve(resolveChoiceIntents[selectedIndex]);
        }
    };

    return (
        <div 
            className="pending-choice-overlay" 
            data-testid="pending-choice-overlay"
            style={{ pointerEvents: 'none' }}
        >
            <div 
                className="pending-choice-modal" 
                role="dialog" 
                aria-modal="true"
                style={{ pointerEvents: 'auto' }}
            >
                <div className="pending-choice-title">Decision required</div>
                <div className="pending-choice-options">
                    {resolveChoiceIntents.map((intent, index) => {
                        const isSelected = selectedIndex === index;
                        return (
                            <button
                                key={`${intentKey(intent)}:${index}`}
                                className={`pending-choice-option ${isSelected ? 'selected' : ''}`}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                data-testid={`pending-choice-option-${index}`}
                                aria-selected={isSelected}
                                style={isSelected ? { borderColor: 'var(--accent-primary)', background: 'rgba(255, 255, 255, 0.1)' } : undefined}
                            >
                                {formatChoiceLabel(intent)}
                            </button>
                        );
                    })}
                </div>
                <div className="pending-choice-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                     <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={selectedIndex === null}
                        data-testid="pending-choice-confirm"
                     >
                        Confirm
                     </button>
                </div>
            </div>
        </div>
    );
};
