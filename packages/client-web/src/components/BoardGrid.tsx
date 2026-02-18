import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { Tile } from './Tile';

interface BoardGridProps {
    G: GameState;
    moves: any;
    intents: LegalIntent[];
    isInteractive: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const BoardGrid: React.FC<BoardGridProps> = ({
    G,
    moves,
    intents,
    isInteractive,
    selectedTileId,
    selectedCoord,
    onSelectTile
}) => {
    const occupiedCoords = useMemo(() => {
        return Object.keys(G.grid || {}).sort((a, b) => a.localeCompare(b));
    }, [G.grid]);

    const ghostCoords = useMemo(() => {
        return intents
            .filter(intent => intent.moveType === 'placeTile' && intent.payload?.targetCoord)
            .map(intent => intent.payload.targetCoord)
            .filter((coord, index, all) => all.indexOf(coord) === index)
            .sort((a, b) => a.localeCompare(b));
    }, [intents]);

    return (
        <div className="board-grid">
            {occupiedCoords.map((coordStr) => {
                const tileId = G.grid[coordStr];
                const tile = G.tiles[tileId];
                const isSelected = selectedTileId === tileId || selectedCoord === coordStr;
                const disabled = !isInteractive;
                const tooltip = `coord ${coordStr}`;
                return (
                    <div key={coordStr} className="board-cell">
                        <Tile
                            tileId={tileId}
                            G={G}
                            onClick={disabled ? undefined : () => onSelectTile && onSelectTile(tileId, coordStr)}
                            selected={isSelected}
                            disabled={disabled}
                            tooltip={tooltip}
                            testId={`board-tile-${coordStr}`}
                        />
                        <div className="coord-label">{coordStr}</div>
                    </div>
                );
            })}

            {ghostCoords.map((coordStr) => {
                const intent = intents.find(i => i.moveType === 'placeTile' && i.payload?.targetCoord === coordStr);
                if (!intent) return null;
                return (
                    <button
                        key={`ghost-${coordStr}`}
                        className="ghost-cell"
                        disabled={!isInteractive}
                        onClick={!isInteractive ? undefined : () => moves[intent.moveType](intent.payload)}
                        data-testid={`ghost-${coordStr}`}
                        title={`Place at ${coordStr}`}
                    >
                        {coordStr}
                    </button>
                );
            })}
        </div>
    );
};
