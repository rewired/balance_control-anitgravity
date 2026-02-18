import React from 'react';
import { Tile as TileType, GameState } from '@balance-control/rules';
import { Token } from './Token';

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
    const tile = G.tiles[tileId];
    const zone = G.zones[tileId];

    if (!tile) return <div className="tile error">Unknown Tile</div>;

    const classes = ['tile'];
    if (selected) classes.push('tile-selected');
    if (disabled) classes.push('tile-disabled');
    if (onClick && !disabled) classes.push('tile-clickable');

    return (
        <div
            className={classes.join(' ')}
            onClick={disabled ? undefined : onClick}
            title={tooltip}
            data-testid={testId}
        >
            <div className="tile-header">
                <span className="tile-type">{tile.type}</span>
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
