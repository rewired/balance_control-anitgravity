import React, { useEffect, useMemo, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { BalanceControlGame } from '../game';
import { Board } from '../Board';

type SeatID = '0' | '1';

const MATCH_ID = 'local-hotseat-2p';

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const HotseatShell: React.FC = () => {
    const [activeSeat, setActiveSeat] = useState<SeatID>('0');

    const localMultiplayer = useMemo(() => Local(), []);

    const clients = useMemo(() => {
        return {
            '0': Client({
                game: BalanceControlGame,
                numPlayers: 2,
                matchID: MATCH_ID,
                playerID: '0',
                multiplayer: localMultiplayer,
            }),
            '1': Client({
                game: BalanceControlGame,
                numPlayers: 2,
                matchID: MATCH_ID,
                playerID: '1',
                multiplayer: localMultiplayer,
            })
        } as const;
    }, [localMultiplayer]);

    const [seatState, setSeatState] = useState<Record<SeatID, any | null>>({ '0': null, '1': null });

    useEffect(() => {
        const unsubscribes: Array<() => void> = [];

        (Object.keys(clients) as SeatID[]).forEach((seat) => {
            const client = clients[seat];
            client.start();
            setSeatState((prev) => ({ ...prev, [seat]: client.getState() }));
            unsubscribes.push(
                client.subscribe((next: any) => {
                    setSeatState((prev) => ({ ...prev, [seat]: next }));
                })
            );
        });

        return () => {
            unsubscribes.forEach((fn) => fn());
            (Object.keys(clients) as SeatID[]).forEach((seat) => {
                clients[seat].stop();
            });
        };
    }, [clients]);

    const state = seatState[activeSeat];
    const ctx = state?.ctx;
    const currentPlayer: string | null = ctx?.currentPlayer ?? null;

    const gameover = Boolean(ctx?.gameover);
    const isMyTurn = currentPlayer === activeSeat;
    const isActiveByStage = Boolean(ctx?.activePlayers?.[activeSeat]);
    const isActive = !gameover && (isMyTurn || isActiveByStage);

    return (
        <>
            <div className="game-topbar glass-panel" data-testid="hotseat-topbar">
                <div className="game-topbar-text" data-testid="hotseat-status">
                    Hotseat | Active seat P{activeSeat} | currentPlayer P{currentPlayer ?? '?'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setActiveSeat('0')}
                        disabled={activeSeat === '0'}
                        data-testid="hotseat-switch-0"
                    >
                        Seat P0
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setActiveSeat('1')}
                        disabled={activeSeat === '1'}
                        data-testid="hotseat-switch-1"
                    >
                        Seat P1
                    </button>
                </div>
            </div>
            {state ? (
                <div data-testid="hotseat-game-screen">
                    <Board
                        G={state.G}
                        ctx={state.ctx}
                        moves={clients[activeSeat].moves}
                        playerID={activeSeat}
                        isActive={isActive}
                    />
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: 16 }} data-testid="hotseat-loading">
                    Loading hotseat match…
                </div>
            )}
        </>
    );
};
