import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { groupMeasureIntents } from '../ui/interaction/measureHelpers';
import { getObjectLabel } from '../ui/interaction/labelHelpers';

interface MeasureTrayProps {
    G: GameState;
    intents: LegalIntent[];
    onSelect: (intent: LegalIntent) => void;
}

/**
 * Tray for displaying open measures grouped by expansion.
 * @remarks Presentation-only (ARCH-01).
 */
export const MeasureTray: React.FC<MeasureTrayProps> = ({ G, intents, onSelect }) => {
    const groups = useMemo(() => groupMeasureIntents(intents), [intents]);

    if (groups.length === 0) return null;

    return (
        <div className="measure-tray" style={{ marginTop: '16px', borderTop: 'var(--border-glass)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Measures
            </h4>
            <div className="measure-groups" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groups.map((group) => (
                    <div key={group.expansionId} className="measure-group">
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-eco)', marginBottom: '4px', textTransform: 'uppercase' }}>
                            {group.expansionId}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {group.intents.map((intent, idx) => {
                                const objectId = intent.payload as string;
                                const label = getObjectLabel(G, objectId);

                                return (
                                    <button
                                        key={idx}
                                        className="btn-secondary"
                                        style={{ textAlign: 'left', padding: '6px 10px', fontSize: '13px', width: '100%' }}
                                        onClick={() => onSelect(intent)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
