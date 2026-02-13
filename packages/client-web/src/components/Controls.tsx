import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';

interface ControlsProps {
    moves: any;
    events?: any;
    ctx: any;
    G: GameState;
    playerID: string;
    isActive: boolean;
    stage?: string | null;
    selectedTileId?: string | null;
    stagedTileId?: string | null;
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

export const Controls: React.FC<ControlsProps> = ({
    moves,
    events,
    ctx,
    G,
    playerID,
    isActive,
    stage,
    selectedTileId,
    stagedTileId
}) => {
    if (!isActive) return null;

    const isDrawAndPlace = stage === 'drawAndPlace';
    const isPoliticalAction = stage === 'politicalAction';

    const legalGhostTargets = useMemo(() => {
        const occupied = Object.keys(G.grid || {});
        const occSet = new Set(occupied);
        if (occSet.size === 0) return ['0,0'];
        const ghosts = new Set<string>();
        for (const coordStr of occupied) {
            const base = stringToCoord(coordStr);
            for (const n of getNeighbors(base)) {
                const s = coordToString(n);
                if (!occSet.has(s)) ghosts.add(s);
            }
        }
        return Array.from(ghosts).sort((a, b) => a.localeCompare(b));
    }, [G.grid]);

    const selectedIsStartCommittee = selectedTileId ? (G.tiles[selectedTileId]?.type === 'StartCommittee') : false;

    return (
        <div className="controls-bar">
            {isDrawAndPlace && (
                <>
                    <span>Staged: {stagedTileId || 'None'}</span>
                    {legalGhostTargets.length === 0 && (
                        <button className="btn-secondary" onClick={() => moves.passTilePlacement({})}>
                            Skip Placement
                        </button>
                    )}
                </>
            )}
            {isPoliticalAction && (
                <>
                    <button
                        className="btn-primary"
                        onClick={() => moves.placeInfluence({ targetTileId: selectedTileId, extraResourceIds: [] })}
                        disabled={!selectedTileId || selectedIsStartCommittee}
                        title={selectedIsStartCommittee ? 'Start Committee cannot be targeted' : undefined}
                        data-testid="btn-place-influence"
                    >
                        Place Influence
                    </button>
                    <button className="btn-secondary" onClick={() => moves.pass({})}>Pass</button>
                </>
            )}
        </div>
    );
};
