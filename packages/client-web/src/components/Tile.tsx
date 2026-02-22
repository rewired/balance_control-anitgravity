import React from 'react';
import { Tile as TileType, GameState } from '@balance-control/rules';
import { Token } from './Token';
import { tileIconUrlByType, tileIconUrlByCode, type TileTypeIconKey, type TileIconCode } from '../ui/tiles/tileAssets';
import { useT } from '../ui/i18n';

interface TileProps {
    tileId: string;
    G: GameState;
    onClick?: () => void;
    selected?: boolean;
    disabled?: boolean;
    tooltip?: string;
    testId?: string;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const Tile: React.FC<TileProps> = ({
    tileId,
    G,
    onClick,
    selected = false,
    disabled = false,
    tooltip,
    testId,
}) => {
    const t = useT();
    const tile = G.tiles[tileId];
    const zone = G.zones[tileId];

    if (!tile) return <div className="tile error">Unknown Tile</div>;

    const classes = ['tile'];
    if (selected) classes.push('tile-selected');
    if (disabled) classes.push('tile-disabled');
    if (onClick && !disabled) classes.push('tile-clickable');

    const typeIconUrl = tile.type in tileIconUrlByType
        ? tileIconUrlByType[tile.type as TileTypeIconKey]
        : undefined;

    const resortIconUrl = tile.resort && tile.resort in tileIconUrlByCode
        ? tileIconUrlByCode[tile.resort as TileIconCode]
        : undefined;

    const typeAlt = tile.type === 'StartCommittee' ? t('core:tileIcon.startTile')
        : tile.type === 'Committee' ? t('core:tileIcon.committee')
        : tile.type === 'Grassroots' ? t('core:tileIcon.grassroots')
        : tile.type === 'Hotspot' ? t('core:tileIcon.hotspot')
        : tile.type === 'Lobbyist' ? t('core:tileIcon.lobbyist')
        : tile.type;

    return (
        <div
            className={classes.join(' ')}
            onClick={disabled ? undefined : onClick}
            title={tooltip}
            data-testid={testId}
        >
            <div className="tile-header">
                {typeIconUrl && <img src={typeIconUrl} className="tile-icon" alt={typeAlt} style={{ width: 16, height: 16, marginRight: 4 }} />}
                <span className="tile-type">{tile.type}</span>
                {resortIconUrl && <img src={resortIconUrl} className="tile-icon" alt={tile.resort} style={{ width: 16, height: 16, marginLeft: 4 }} />}
                {tile.resort && <span className="tile-resort">{tile.resort}</span>}
            </div>
            <div className="tile-body">
                {/* Weight / Power */}
                <div className="tile-weight">{tile.weight}</div>
            </div>
            <div className="tile-content">
                {/* Render items on the tile (influence/resources) */}
                {zone && zone.items.map(itemId => {
                    const obj = G.objects[itemId];
                    if (!obj) return null;
                    return <Token key={itemId} object={obj} />;
                })}
            </div>
        </div>
    );
};
