import React, { useMemo, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import { Zone } from './Zone';
import { Controls } from './Controls';
import { BoardViewport } from './BoardViewport';

interface GameLayoutProps {
    G: GameState;
    ctx: any;
    moves: any;
    playerID: string | null;
    isActive: boolean;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ G, ctx, moves, playerID, isActive }) => {
    const zoneNames = {
        PersonalSupply: 'PersonalSupply',
        Bank: 'Bank',
        Board: 'Board',
        DrawPile: 'DrawPile',
        Noise: 'Noise'
    } as const;

    // Determine player's personal supply
    const myPid = playerID ?? ctx.currentPlayer ?? '0';
    const mySupplyId = `${zoneNames.PersonalSupply}:${myPid}`;
    const stage = useMemo(() => {
        const pid = playerID ?? ctx.currentPlayer;
        const ap = ctx.activePlayers || {};
        return ap[pid] || null;
    }, [ctx, playerID]);

    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;
    const intents: LegalIntent[] = useMemo(() => {
        return enumerateLegalIntents(G, ctx, myPid);
    }, [G, ctx, myPid]);

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
                <BoardViewport
                    G={G}
                    moves={moves}
                    intents={intents}
                    isInteractive={isActive}
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
                    isActive={isActive}
                    stage={stage}
                    intents={intents}
                    selectedTileId={selectedTileId}
                    stagedTileId={stagedTileId}
                />
            </div>
        </div>
    );
};
