import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { CoreZoneName } from '@balance-control/rules';
import { ResortIcon } from '../ui/tiles/ResortIcon';
import { LobbyistIcon } from '../ui/tiles/LobbyistIcon';
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
        if (!zone) return { influence: 0, resources: {} as Record<string, number>, metaMarker: null };

        let influence = 0;
        const resources: Record<string, number> = {};
        let metaMarker: any = null;

        for (const itemId of zone.items) {
            const obj = G.objects[itemId];
            if (!obj) continue;

            if (obj.type === 'Influence') {
                influence++;
            } else if (obj.type === 'Resource' && obj.resort) {
                const type = obj.resort;
                resources[type] = (resources[type] || 0) + 1;
            } else if (obj.type === 'MetaMarker') {
                metaMarker = obj;
            }
        }
        return { influence, resources, metaMarker };
    }, [G, supplyZoneId]);

    // Sort resources for stable order
    const sortedResources = useMemo(() => {
        return Object.entries(counts.resources).sort(([a], [b]) => a.localeCompare(b));
    }, [counts.resources]);

    // Seat colors mapping
    const seatColorVar = `--seat-${parseInt(playerId) + 1}`;

    const stats = (G.meta as any)?.stats?.[playerId];
    const boardInfluence = stats?.boardInfluence ?? 0;
    const metaMarker = stats?.metaMarker;

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
                <div className="resource-item" title={t('core:inspector.influence') + ' (Supply)'}>
                    <div className="resource-icon influence-icon" aria-label="Influence Supply">
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: `var(${seatColorVar})`,
                            border: '1px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: '-2px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '50%'
                            }} />
                        </div>
                    </div>
                    <span className="resource-count">{counts.influence}</span>
                </div>

                {/* Board Influence */}
                <div className="resource-item" title="Influence on Board">
                    <div className="resource-icon influence-board-icon" aria-label="Board Influence">
                        <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: 'transparent',
                            border: `2px solid var(${seatColorVar})`,
                            boxShadow: `0 0 6px var(${seatColorVar})`,
                        }} />
                    </div>
                    <span className="resource-count highlighted">{boardInfluence}</span>
                </div>

                {/* Meta-Marker Supply */}
                {counts.metaMarker && (
                    <div className="resource-item" title="Meta-Marker (Ready)">
                        <div className="resource-icon meta-marker-icon" aria-label="Meta-Marker Supply">
                            <svg width="20" height="20" viewBox="0 0 24 24" style={{ color: `var(${seatColorVar})` }}>
                                <LobbyistIcon mode={counts.metaMarker.mode} />
                            </svg>
                        </div>
                        <span className="resource-count">1</span>
                    </div>
                )}

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
