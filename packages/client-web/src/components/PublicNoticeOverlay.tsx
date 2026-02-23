import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { Tile } from './Tile';
import { useT } from '../ui/i18n';
import type { UiNotice } from '../ui/interaction/types';

interface PublicNoticeOverlayProps {
    G: GameState;
    uiNotices?: UiNotice[] | undefined;
}

type TileUnplaceableEntry = {
    kind: 'tile.unplaceable';
    playerId: string;
    tileId: string;
};

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const PublicNoticeOverlay: React.FC<PublicNoticeOverlayProps> = ({ G, uiNotices }) => {
    const t = useT();
    const latest = useMemo(() => {
        const entries = (G.engine?.attributes as any)?.publicLog;
        if (!Array.isArray(entries)) return null;
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i] as any;
            if (entry && entry.kind === 'tile.unplaceable') return entry as TileUnplaceableEntry;
        }
        return null;
    }, [G.engine?.attributes]);

    const hasToasts = (uiNotices?.length ?? 0) > 0;
    if (!latest && !hasToasts) return null;

    const tileId = latest?.tileId;
    const hasTile = Boolean(tileId && G.tiles?.[tileId]);

    return (
        <div className="public-notice-overlay" data-testid="public-notice-overlay">
            {latest && (
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
            )}

            {uiNotices?.map((notice) => {
                if (notice.kind !== 'dispatch.rejected') return null;
                return (
                    <div
                        key={notice.id}
                        className="ui-toast-card glass-panel ui-toast-danger"
                        data-testid={`ui-toast-${notice.kind}`}
                    >
                        <div className="ui-toast-title">{t('core:ui.moveRejectedTitle')}</div>
                        <div className="ui-toast-message">
                            {t('core:ui.moveRejectedBody', {
                                moveType: notice.moveType,
                                seat: notice.seat,
                                currentPlayer: notice.currentPlayer ?? '?',
                            })}
                        </div>
                        <div className="ui-toast-reason">{t(`core:ui.moveRejectedReason.${notice.reason}`)}</div>
                    </div>
                );
            })}
        </div>
    );
};
