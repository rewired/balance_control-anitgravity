import React from 'react';
import type { GameState } from '@balance-control/rules';
import { Zone } from './Zone';
import { Controls } from './Controls';

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
                <Zone zoneId={zoneNames.Board} G={G} className="board-grid" />
            </main>

            {/* Right Panel: Opponents / Deck / Info */}
            <aside className="right-panel glass-panel">
                <Zone zoneId={zoneNames.DrawPile} G={G} title="Draw Pile" />
                <Zone zoneId={zoneNames.Noise} G={G} title="Noise" />
            </aside>

            {/* Bottom Controls */}
            <div className="controls-container glass-panel">
                <Controls moves={moves} events={events} ctx={ctx} isActive={isActive} />
            </div>
        </div>
    );
};
