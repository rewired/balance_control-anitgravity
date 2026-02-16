import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { Tile } from './Tile';

interface PublicNoticeOverlayProps {
    G: GameState;
}

type TileUnplaceableEntry = {
    kind: 'tile.unplaceable';
    playerId: string;
    tileId: string;
};

export const PublicNoticeOverlay: React.FC<PublicNoticeOverlayProps> = ({ G }) => {
    const latest = useMemo(() => {
        const entries = (G.engine?.attributes as any)?.publicLog;
        if (!Array.isArray(entries)) return null;
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i] as any;
            if (entry && entry.kind === 'tile.unplaceable') return entry as TileUnplaceableEntry;
        }
        return null;
    }, [G.engine?.attributes]);

    if (!latest) return null;

    const tileId = latest.tileId;
    const hasTile = Boolean(tileId && G.tiles?.[tileId]);

    return (
        <div className="public-notice-overlay" data-testid="public-notice-overlay">
            <div className="public-notice-card glass-panel">
                <div className="public-notice-message">
                    Player {latest.playerId} drew a tile that cannot be placed. It was discarded face-up.
                </div>
                {hasTile && (
                    <div className="public-notice-tile">
                        <Tile tileId={tileId} G={G} disabled={true} testId="public-notice-tile" />
                    </div>
                )}
            </div>
        </div>
    );
};
