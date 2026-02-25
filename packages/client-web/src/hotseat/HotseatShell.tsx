import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { BalanceControlGame } from '../game';
import { Board } from '../Board';
import { computeUiStateKey } from '../ui/interaction/diagnostics';
import type { DispatchTripwireInfo } from '../ui/interaction/types';

type SeatID = '0' | '1';

type HotseatE2EApi = {
    getStateID: () => number | null;
    getPendingChoiceKind: () => string | null;
    setPendingChoice: (pendingChoice: { kind: string; spec?: Record<string, unknown>; player?: string }) => void;
    clearPendingChoice: () => void;
};

const MATCH_ID = 'local-hotseat-2p';

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const HotseatShell: React.FC = () => {
    const [activeSeat, setActiveSeat] = useState<SeatID>('0');
    const [tripwireMismatch, setTripwireMismatch] = useState<DispatchTripwireInfo | null>(null);

    const localMultiplayer = useMemo(() => Local(), []);

    const client = useMemo(() => {
        return Client({
            game: BalanceControlGame,
            numPlayers: 2,
            matchID: MATCH_ID,
            playerID: '0',
            multiplayer: localMultiplayer,
            debug: false,
        });
    }, [localMultiplayer]);

    const [clientState, setClientState] = useState<any>(null);

    useEffect(() => {
        client.start();
        setClientState(client.getState());
        const unsubscribe = client.subscribe((next: any) => setClientState(next));

        return () => {
            unsubscribe();
            client.stop();
        };
    }, [client]);

    useEffect(() => {
        client.updatePlayerID(activeSeat);
        // updatePlayerID may not emit a state subscription update when only the playerView changes.
        setClientState(client.getState());
    }, [activeSeat, client]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!(window as any).__BC_ENABLE_E2E_HOOKS__) return;

        let choiceSeq = 0;

        const refreshClientState = () => {
            const snapshot = { ...(client.getState() ?? {}) };
            (window as any).__BC_HOTSEAT_E2E_STATE__ = snapshot;
            setClientState(snapshot);
        };

        const api: HotseatE2EApi = {
            getStateID: () => {
                const s = client.getState();
                return s?.ctx?._stateID ?? s?.ctx?.stateID ?? s?._stateID ?? null;
            },
            getPendingChoiceKind: () => {
                const s = client.getState();
                return s?.G?.engine?.pendingChoice?.kind ?? null;
            },
            setPendingChoice: ({ kind, spec, player }) => {
                const s = client.getState();
                if (!s?.G?.engine) return;
                const targetPlayer = player ?? s.ctx?.currentPlayer ?? activeSeat;
                const choiceId = `e2e_choice_${choiceSeq++}`;
                s.G.engine.pendingChoice = {
                    choiceId,
                    sourceId: 'e2e_injected_pending_choice',
                    player: targetPlayer,
                    kind,
                    spec: spec ?? {},
                    resumeToken: choiceId,
                };
                refreshClientState();
            },
            clearPendingChoice: () => {
                const s = client.getState();
                if (!s?.G?.engine) return;
                s.G.engine.pendingChoice = undefined;
                refreshClientState();
            }
        };

        (window as any).__BC_HOTSEAT_E2E__ = api;
        (window as any).__BC_HOTSEAT_E2E_STATE__ = client.getState();

        return () => {
            if ((window as any).__BC_HOTSEAT_E2E__ === api) {
                delete (window as any).__BC_HOTSEAT_E2E__;
            }
            delete (window as any).__BC_HOTSEAT_E2E_STATE__;
        };
    }, [activeSeat, client]);

    // Render and dispatch moves from the same Client state authority.
    const G = clientState?.G;
    const ctx = clientState?.ctx;

    const currentPlayer: string | null = ctx?.currentPlayer ?? null;
    const gameover = Boolean(ctx?.gameover);
    const isMyTurn = currentPlayer === activeSeat;
    const isActiveByStage = Boolean(ctx?.activePlayers?.[activeSeat]);
    const isActive = !gameover && (isMyTurn || isActiveByStage);

    const getDispatchStateKey = useCallback(() => {
        const s = client.getState();
        return computeUiStateKey(s?.G, s?.ctx);
    }, [client]);

    const handleTripwireMismatch = useCallback((info: DispatchTripwireInfo) => {
        setTripwireMismatch(info);
    }, []);

    return (
        <>
            <div className="game-topbar glass-panel" data-testid="hotseat-topbar">
                <div className="game-topbar-text" data-testid="hotseat-status">
                    Hotseat | Active seat P{activeSeat} | currentPlayer P{currentPlayer ?? '?'}
                </div>
                {import.meta.env.DEV && tripwireMismatch && (
                    <div
                        className="hotseat-tripwire-badge"
                        data-testid="hotseat-tripwire"
                        title={`UI/dispatch mismatch (last move: ${tripwireMismatch.moveType})`}
                    >
                        DESYNC
                    </div>
                )}
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
            {G && ctx ? (
                <div data-testid="hotseat-game-screen">
                    <Board
                        G={G}
                        ctx={ctx}
                        moves={client.moves}
                        playerID={activeSeat}
                        isActive={isActive}
                        getDispatchStateKey={getDispatchStateKey}
                        onTripwireMismatch={handleTripwireMismatch}
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
