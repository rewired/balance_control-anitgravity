import React from 'react';
import { LegalIntent } from '@balance-control/game';

interface Props {
    intent: LegalIntent | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const MoveConfirmationModal: React.FC<Props> = ({ intent, onConfirm, onCancel }) => {
    if (!intent) return null;

    const consequences = intent.consequences || [];
    const description = intent.description;

    const title = intent.moveType === 'placeInfluence' ? 'Confirm Place Influence' : 'Confirm Move Influence';

    return (
        <div className="pending-choice-overlay" data-testid="move-confirmation-modal">
            <div className="pending-choice-modal" role="dialog" aria-modal="true" style={{ maxWidth: '400px' }}>
                <div className="pending-choice-title">{title}</div>
                <div style={{ padding: '0 16px 16px 16px', color: '#eee' }}>
                    {intent.moveType === 'placeInfluence' && (
                        <p style={{ margin: '0 0 12px 0' }}>
                            Target Tile: <strong>{intent.payload.targetTileId}</strong>
                        </p>
                    )}
                    {intent.moveType === 'moveInfluence' && (
                        <p style={{ margin: '0 0 12px 0' }}>
                            From <strong>{intent.payload.sourceId}</strong> to <strong>{intent.payload.targetId}</strong>
                        </p>
                    )}

                    {description && <p style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>{description}</p>}

                    {consequences.length > 0 && (
                        <div style={{ background: 'rgba(255, 100, 100, 0.1)', padding: '8px', borderRadius: '4px', marginBottom: '16px' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: '#ff8888' }}>Consequences:</h4>
                            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9em' }}>
                                {consequences.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="pending-choice-options" style={{ display: 'flex', gap: '8px', padding: '0 16px 16px 16px' }}>
                    <button className="btn-primary" onClick={onConfirm} style={{ flex: 1 }}>Confirm</button>
                    <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};
