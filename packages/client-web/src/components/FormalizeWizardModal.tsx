import React from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import type { FormalizeGroup } from '../ui/interaction/formalizeHelpers';

interface FormalizeWizardModalProps {
    open: boolean;
    G: GameState;
    committeeTileId: string;
    groups: FormalizeGroup[];
    onSelectIntent: (intent: LegalIntent) => void;
    onClose: () => void;
}

/**
 * Helper to get a human-readable label for a resource ID.
 * @remarks Presentation-only.
 */
const getResourceLabel = (G: GameState, resourceId: string): string => {
    const obj = G.objects[resourceId];
    if (!obj) return resourceId;
    if (obj.type === 'Resource') {
        return obj.resort || resourceId;
    }
    return resourceId;
};

/**
 * Wizard for selecting FormalizeInfluence parameters.
 * @remarks Presentation-only (ARCH-01).
 * @see CORE-01-04-13..15
 */
export const FormalizeWizardModal: React.FC<FormalizeWizardModalProps> = ({
    open,
    G,
    committeeTileId,
    groups,
    onSelectIntent,
    onClose
}) => {
    if (!open) return null;

    const committeeTile = G.tiles[committeeTileId];

    return (
        <div className="pending-choice-overlay" data-testid="formalize-wizard-modal">
            <div className="pending-choice-modal" role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
                <div className="pending-choice-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Formalize Influence</span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', padding: 0 }}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="wizard-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div className="committee-info" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
                        <div style={{ fontWeight: 'bold' }}>Committee: {committeeTileId}</div>
                        {committeeTile && (
                            <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                                Resort: {(committeeTile.resort || 'N/A').toUpperCase()} | Weight: {committeeTile.weight}
                            </div>
                        )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', marginBottom: '16px' }}>
                        Select a payment combination:
                    </p>

                    <div className="payment-options" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {groups.map((group) => {
                            const paymentLabels = group.paymentResourceIds.map((id) => getResourceLabel(G, id).toUpperCase());

                            return (
                                <div key={group.paymentKey} className="payment-group" style={{ border: 'var(--border-glass)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: 'var(--border-glass)', color: 'var(--text-secondary)' }}>
                                        Pay: {paymentLabels.join(', ')}
                                    </div>
                                    <div className="variants" style={{ display: 'flex', flexDirection: 'column' }}>
                                        {group.variants.map((intent, idx) => {
                                            const extra = (intent.payload?.extraResourceIds as string[]) ?? [];
                                            const extraLabels = extra.map((id) => getResourceLabel(G, id).toUpperCase());
                                            const label = extra.length > 0
                                                ? `Include extra: ${extraLabels.join(', ')}`
                                                : 'Standard payment (no extras)';

                                            return (
                                                <button
                                                    key={idx}
                                                    className="pending-choice-option"
                                                    style={{
                                                        textAlign: 'left',
                                                        border: 'none',
                                                        borderBottom: idx < group.variants.length - 1 ? 'var(--border-glass)' : 'none',
                                                        borderRadius: 0,
                                                        background: 'transparent'
                                                    }}
                                                    onClick={() => onSelectIntent(intent)}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pending-choice-options" style={{ marginTop: 'var(--space-md)' }}>
                    <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};
