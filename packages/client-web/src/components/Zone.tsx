import React from 'react';
import { Zone as ZoneType, GameState } from '@balance-control/rules';
import { Token } from './Token';
import { Tile } from './Tile';

interface ZoneProps {
    zoneId: string;
    G: GameState;
    title?: string;
    className?: string;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const Zone: React.FC<ZoneProps> = ({ zoneId, G, title, className }) => {
    const zone = G.zones[zoneId];
    if (!zone) return null;

    return (
        <div className={`zone ${className || ''}`}>
            {title && <h4 className="zone-title">{title}</h4>}
            {zone.items.map(itemId => {
                // Check if it's a Tile or an Object
                if (G.tiles[itemId]) {
                    return <Tile key={itemId} tileId={itemId} G={G} />;
                }
                const obj = G.objects[itemId];
                if (obj) {
                    return <Token key={itemId} object={obj} />;
                }
                return null;
            })}
        </div>
    );
};
