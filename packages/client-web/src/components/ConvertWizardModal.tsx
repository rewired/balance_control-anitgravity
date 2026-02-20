import React, { useEffect, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import type { ConvertTileGroup } from '../ui/interaction/convertHelpers';
import { getObjectLabel } from '../ui/interaction/labelHelpers';

interface ConvertWizardModalProps {
    open: boolean;
    G: GameState;
    grassrootsTileId: string;
    tileGroup: ConvertTileGroup | null;
    onSelectIntent: (intent: LegalIntent) => void;
    onClose: () => void;
}

/**
 * Wizard for selecting ConvertResources parameters.
 * @remarks Presentation-only (ARCH-01).
 * @see CORE-01-04-09
 */
export const ConvertWizardModal: React.FC<ConvertWizardModalProps> = ({
    open,
    G,
    grassrootsTileId,
    tileGroup,
    onSelectIntent,
    onClose
}) => {
    const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setSelectedOutput(null);
        }
    }, [open, grassrootsTileId]);

    if (!open || !tileGroup) return null;

    const outputGroup = selectedOutput ? tileGroup.outputs.find(o => o.outputResort === selectedOutput) : null;

    return (
        <div className="pending-choice-overlay" data-testid="convert-wizard-modal">
            <div className="pending-choice-modal" role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
                <div className="pending-choice-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Convert Resources</span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px', padding: 0 }}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="wizard-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div className="tile-info" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: 'var(--border-glass)' }}>
                        <div style={{ fontWeight: 'bold' }}>Grassroots Tile: {grassrootsTileId}</div>
                        <div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                            Choose output resort and input combo.
                        </div>
                    </div>

                    {!selectedOutput ? (
                        <>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', marginBottom: '16px' }}>
                                Select output resort:
                            </p>
                            <div className="output-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {tileGroup.outputs.map((o) => (
                                    <button
                                        key={o.outputResort}
                                        className="btn-secondary"
                                        style={{ minWidth: '80px' }}
                                        onClick={() => setSelectedOutput(o.outputResort)}
                                    >
                                        {o.outputResort}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                    onClick={() => setSelectedOutput(null)}
                                >
                                    &larr; Back
                                </button>
                                <span style={{ fontWeight: '600' }}>Output: {selectedOutput}</span>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', marginBottom: '16px' }}>
                                Select input combo:
                            </p>

                            <div className="input-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {outputGroup?.combos.map((combo) => {
                                    const inputLabels = combo.inputResourceIds.map(id => getObjectLabel(G, id).toUpperCase());

                                    return (
                                        <div key={combo.inputKey} className="combo-group" style={{ border: 'var(--border-glass)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: 'var(--border-glass)', color: 'var(--text-secondary)' }}>
                                                Use: {inputLabels.join(', ')}
                                            </div>
                                            <div className="variants" style={{ display: 'flex', flexDirection: 'column' }}>
                                                {combo.variants.map((intent, idx) => {
                                                    const extra = (intent.payload?.extraResourceIds as string[]) ?? [];
                                                    const extraLabels = extra.map(id => getObjectLabel(G, id).toUpperCase());
                                                    const label = extra.length > 0
                                                        ? `Include extra: ${extraLabels.join(', ')}`
                                                        : 'Standard cost (no extras)';

                                                    return (
                                                        <button
                                                            key={idx}
                                                            className="pending-choice-option"
                                                            style={{
                                                                textAlign: 'left',
                                                                border: 'none',
                                                                borderBottom: idx < combo.variants.length - 1 ? 'var(--border-glass)' : 'none',
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
                        </>
                    )}
                </div>

                <div className="pending-choice-options" style={{ marginTop: 'var(--space-md)' }}>
                    <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};
