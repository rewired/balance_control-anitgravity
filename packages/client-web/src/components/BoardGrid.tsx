import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { Tile } from './Tile';

interface BoardGridProps {
    G: GameState;
    ctx: any;
    moves: any;
    playerID: string | null;
    stage?: string;
    selectedTileId?: string | null;
    onSelectTile?: (tileId: string) => void;
}

function stringToCoord(s: string): { q: number; r: number } {
    const [q, r] = s.split(',').map(Number);
    return { q, r };
}

function coordToString(c: { q: number; r: number }): string {
    return `${c.q},${c.r}`;
}

function getNeighbors(c: { q: number; r: number }): { q: number; r: number }[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: c.q + d.q, r: c.r + d.r }));
}

export const BoardGrid: React.FC<BoardGridProps> = ({
    G,
    ctx,
    moves,
    playerID,
    stage,
    selectedTileId,
    onSelectTile
}) => {
    const occupiedCoords = useMemo(() => {
        return Object.keys(G.grid || {}).sort((a, b) => a.localeCompare(b));
    }, [G.grid]);

    const ghostCoords = useMemo(() => {
        const occ = new Set(occupiedCoords);
        if (occ.size === 0) return ['0,0'];
        const ghosts = new Set<string>();
        for (const coordStr of occupiedCoords) {
            const base = stringToCoord(coordStr);
            const neighbors = getNeighbors(base);
            for (const n of neighbors) {
                const s = coordToString(n);
                if (!occ.has(s)) ghosts.add(s);
            }
        }
        return Array.from(ghosts).sort((a, b) => a.localeCompare(b));
    }, [occupiedCoords]);

    const isDrawAndPlace = stage === 'drawAndPlace';

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

            {isDrawAndPlace && ghostCoords.map((coordStr) => (
                <button
                    key={`ghost-${coordStr}`}
                    className="ghost-cell"
                    onClick={() => moves.placeTile({ targetCoord: coordStr, extraResourceIds: [] })}
                    data-testid={`ghost-${coordStr}`}
                    title={`Place at ${coordStr}`}
                >
                    {coordStr}
                </button>
            ))}
        </div>
    );
};
