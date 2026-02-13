import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { Tile } from './Tile';

interface BoardGridProps {
    G: GameState;
    moves: any;
    intents: LegalIntent[];
    selectedTileId?: string | null;
    onSelectTile?: (tileId: string) => void;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
    G,
    moves,
    intents,
    selectedTileId,
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
                const isSelected = selectedTileId === tileId;
                const disabled = false;
                const tooltip = `coord ${coordStr}`;
                return (
                    <div key={coordStr} className="board-cell">
                        <Tile
                            tileId={tileId}
                            G={G}
                            onClick={() => onSelectTile && onSelectTile(tileId)}
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
                        onClick={() => moves[intent.moveType](intent.payload)}
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
