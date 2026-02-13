import React, { useMemo, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import { Zone } from './Zone';
import { Controls } from './Controls';
import { BoardGrid } from './BoardGrid';

interface GameLayoutProps {
    G: GameState;
    ctx: any;
    moves: any;
    events?: any;
    playerID: string | null;
    isActive: boolean;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ G, ctx, moves, events, playerID, isActive }) => {
    const zoneNames = {
        PersonalSupply: 'PersonalSupply',
        Bank: 'Bank',
        Board: 'Board',
        DrawPile: 'DrawPile',
        Noise: 'Noise'
    } as const;

    // Determine player's personal supply
    const myPid = playerID || '0';
    const mySupplyId = `${zoneNames.PersonalSupply}:${myPid}`;
    const stage = useMemo(() => {
        const pid = playerID ?? ctx.currentPlayer;
        const ap = ctx.activePlayers || {};
        return ap[pid] || null;
    }, [ctx, playerID]);

    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;

    return (
        <div className="game-layout">

            {/* Left Panel: Bank & Supply */}
            <aside className="left-panel glass-panel">
                <div className="player-info">
                    <h3>Player {myPid}</h3>
                    <div className="status-indicator" style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: ctx.currentPlayer === myPid ? 'var(--accent-eco)' : 'var(--text-secondary)'
                    }} />
                </div>

                <Zone zoneId={mySupplyId} G={G} title="My Supply" />
                <Zone zoneId={zoneNames.Bank} G={G} title="Bank" />
            </aside>

            {/* Center: Board */}
            <main className="center-panel glass-panel">
                <h3>Board</h3>
                <BoardGrid
                    G={G}
                    ctx={ctx}
                    moves={moves}
                    playerID={playerID}
                    stage={stage || undefined}
                    selectedTileId={selectedTileId}
                    onSelectTile={setSelectedTileId}
                />
            </main>

            {/* Right Panel: Opponents / Deck / Info */}
            <aside className="right-panel glass-panel">
                <Zone zoneId={zoneNames.DrawPile} G={G} title="Draw Pile" />
                <Zone zoneId={zoneNames.Noise} G={G} title="Noise" />
            </aside>

            {/* Bottom Controls */}
            <div className="controls-container glass-panel">
                <Controls
                    moves={moves}
                    events={events}
                    ctx={ctx}
                    G={G}
                    playerID={myPid}
                    isActive={isActive}
                    stage={stage}
                    selectedTileId={selectedTileId}
                    stagedTileId={stagedTileId}
                />
            </div>
        </div>
    );
};
