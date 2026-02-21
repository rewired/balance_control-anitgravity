import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { CoreZoneName } from '@balance-control/rules';
import { ResortIcon } from '../ui/tiles/ResortIcon';
import { useT } from '../ui/i18n';

interface PlayerResourcesRowProps {
    playerId: string;
    G: GameState;
    active: boolean;
}

export const PlayerResourcesRow: React.FC<PlayerResourcesRowProps> = ({ playerId, G, active }) => {
    const t = useT();
    const supplyZoneId = `${CoreZoneName.PersonalSupply}:${playerId}`;

    const counts = useMemo(() => {
        const zone = G.zones[supplyZoneId];
        if (!zone) return { influence: 0, resources: {} as Record<string, number> };

        let influence = 0;
        const resources: Record<string, number> = {};

        for (const itemId of zone.items) {
            const obj = G.objects[itemId];
            if (!obj) continue;

            if (obj.type === 'Influence') {
                influence++;
            } else if (obj.type === 'Resource' && obj.resort) {
                const type = obj.resort;
                resources[type] = (resources[type] || 0) + 1;
            }
        }
        return { influence, resources };
    }, [G, supplyZoneId]);

    // Sort resources for stable order
    const sortedResources = useMemo(() => {
        return Object.entries(counts.resources).sort(([a], [b]) => a.localeCompare(b));
    }, [counts.resources]);

    // Seat colors mapping
    const seatColorVar = `--seat-${parseInt(playerId) + 1}`;

    return (
        <div className={`player-resources-row ${active ? 'active' : ''}`} data-testid={`player-resources-${playerId}`}>
            <div className="player-indicator">
                <div
                    className="status-indicator"
                    style={{
                        background: active ? `var(${seatColorVar})` : 'var(--text-secondary)',
                    }}
                />
                <span className="player-label">P{playerId}</span>
            </div>

            <div className="resources-list">
                {/* Influence Supply */}
                <div className="resource-item" title={t('core:inspector.influence') || 'Influence'}>
                    <div className="resource-icon influence-icon" aria-label="Influence">
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: `var(${seatColorVar})`,
                            border: '1px solid rgba(255,255,255,0.5)',
                            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                        }} />
                    </div>
                    <span className="resource-count">{counts.influence}</span>
                </div>

                {/* Resources */}
                {sortedResources.map(([resort, count]) => (
                    <div key={resort} className="resource-item" title={resort}>
                        <div className="resource-icon" aria-label={resort}>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <ResortIcon resort={resort} />
                            </svg>
                        </div>
                        <span className="resource-count">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
