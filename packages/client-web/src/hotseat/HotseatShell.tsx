import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { createClientGameWithReplayHooks } from '../game';
import { Board } from '../Board';
import { computeUiStateKey } from '../ui/interaction/diagnostics';
import type { DispatchTripwireInfo } from '../ui/interaction/types';
import { dispatchIntentToMoves, runBotOrchestratorForSnapshot } from '../bot/orchestratorBridge';
import { HotseatForwardingReplaySink } from '../replay/hotseat-forwarding-sink';

type SeatID = '0' | '1';

type HotseatE2EApi = {
    getStateID: () => number | null;
    getPendingChoiceKind: () => string | null;
    buildPendingChoiceFixture: (input: { kind: string; player?: string; choiceId?: string; spec?: Record<string, unknown> }) => {
        choiceId: string;
        sourceId: string;
        player: string;
        kind: string;
        spec: Record<string, unknown>;
        resumeToken: string;
    };
    setPendingChoice: (pendingChoice: { kind: string; spec?: Record<string, unknown>; player?: string }) => void;
    clearPendingChoice: () => void;
};

type ClientStateSnapshot = ReturnType<ReturnType<typeof Client>['getState']>;

type StateIDCarrier = {
    _stateID?: number;
    stateID?: number;
    ctx?: {
        _stateID?: number;
        stateID?: number;
    };
};

const readStateID = (snapshot: ClientStateSnapshot): number | null => {
    const carrier = snapshot as StateIDCarrier | null;
    return carrier?._stateID ?? carrier?.stateID ?? carrier?.ctx?._stateID ?? carrier?.ctx?.stateID ?? null;
};

const MATCH_ID = 'local-hotseat-2p';

const pendingChoiceSpecMatrix: Readonly<Record<string, Record<string, unknown>>> = Object.freeze({
    selectOption: Object.freeze({ options: ['A', 'B'] }),
    selectTile: Object.freeze({ tileIds: ['tile_alpha', 'tile_beta'] }),
    selectResource: Object.freeze({ resourceIds: ['resource_DOM_0', 'resource_FOR_0'] }),
    selectPlayer: Object.freeze({ playerIds: ['0', '1'] }),
    yesNo: Object.freeze({ options: [true, false] }),
});

const isPendingChoiceFixtureComplete = (pendingChoice: {
    choiceId?: string;
    kind?: string;
    spec?: Record<string, unknown>;
}): boolean => {
    if (!pendingChoice.choiceId || !pendingChoice.kind || !pendingChoice.spec) return false;
    const requiredSpec = pendingChoiceSpecMatrix[pendingChoice.kind] ?? {};
    for (const requiredKey of Object.keys(requiredSpec)) {
        if (!(requiredKey in pendingChoice.spec)) {
            return false;
        }
    }
    return true;
};

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const HotseatShell: React.FC<{ setupData?: unknown }> = ({ setupData }) => {
    const [activeSeat, setActiveSeat] = useState<SeatID>('0');
    const [tripwireMismatch, setTripwireMismatch] = useState<DispatchTripwireInfo | null>(null);

    const localMultiplayer = useMemo(() => Local(), []);

    const client = useMemo(() => {
        return Client({
            game: createClientGameWithReplayHooks({
                sink: new HotseatForwardingReplaySink(),
                includeStateHash: true,
            }),
            numPlayers: 2,
            matchID: MATCH_ID,
            playerID: '0',
            setupData,
            multiplayer: localMultiplayer,
            debug: false,
        } as any);
    }, [localMultiplayer, setupData]);

    const [clientState, setClientState] = useState<any>(null);
    const [botRunInFlight, setBotRunInFlight] = useState(false);
    const injectedStateIdBumpRef = useRef(0);

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
        const snapshot = client.getState();
        if (!snapshot?.G || !snapshot?.ctx || snapshot.ctx.gameover || botRunInFlight) {
            return;
        }

        setBotRunInFlight(true);
        void runBotOrchestratorForSnapshot({
            snapshot: { G: snapshot.G, ctx: snapshot.ctx },
            dispatchIntentToMoves: async (intent, playerID) => {
                client.updatePlayerID(playerID);
                dispatchIntentToMoves(client.moves as Record<string, (...args: any[]) => unknown>, intent);
                client.updatePlayerID(activeSeat);
            },
            getLatestSnapshot: () => {
                const latest = client.getState();
                return { G: latest?.G, ctx: latest?.ctx };
            }
        })
            .catch((error) => {
                console.warn('[HotseatShell] bot orchestrator stopped with error', error);
            })
            .finally(() => setBotRunInFlight(false));
    }, [activeSeat, botRunInFlight, client, clientState?.ctx?.currentPlayer, clientState?.ctx?.gameover, clientState?.G]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!(window as any).__BC_ENABLE_E2E_HOOKS__) return;

        let choiceSeq = 0;

        const refreshClientState = () => {
            const actualState = client.getState();
            if (!actualState) return;
            // Provide a fresh G reference so React memos (like useIntentViewModel) recalculate
            const snapshot = {
                ...actualState,
                G: { ...actualState.G }
            };
            (window as any).__BC_HOTSEAT_E2E_STATE__ = snapshot;
            setClientState(snapshot);
        };

        const api: HotseatE2EApi = {
            getStateID: () => {
                const baseStateId = readStateID(client.getState());
                if (baseStateId === null) return injectedStateIdBumpRef.current;
                return baseStateId + injectedStateIdBumpRef.current;
            },
            getPendingChoiceKind: () => {
                const s = client.getState();
                return s?.G?.engine?.pendingChoice?.kind ?? null;
            },
            buildPendingChoiceFixture: ({ kind, player, choiceId, spec }) => {
                const snapshot = client.getState();
                const resolvedChoiceId = choiceId ?? `e2e_choice_${choiceSeq++}`;
                const defaultSpec = pendingChoiceSpecMatrix[kind] ?? {};

                return {
                    choiceId: resolvedChoiceId,
                    sourceId: 'e2e_injected_pending_choice',
                    player: player ?? snapshot?.ctx?.currentPlayer ?? activeSeat,
                    kind,
                    spec: { ...defaultSpec, ...(spec ?? {}) },
                    resumeToken: resolvedChoiceId,
                };
            },
            setPendingChoice: ({ kind, spec, player }) => {
                const s = client.getState();
                if (!s?.G?.engine) return;
                const newChoice = api.buildPendingChoiceFixture({ kind, spec, player });
                s.G.engine.pendingChoice = newChoice;

                const pendingChoice = s.G.engine.pendingChoice;
                const matchesActivePlayer = pendingChoice.player === activeSeat;
                const isComplete = isPendingChoiceFixtureComplete(pendingChoice);
                console.info('[BC:E2E] setPendingChoice', {
                    kind: pendingChoice.kind,
                    pendingPlayer: pendingChoice.player,
                    activePlayerID: activeSeat,
                    matchesActivePlayer,
                    isComplete,
                    choiceId: pendingChoice.choiceId,
                });
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
                        moves={
                            new Proxy(client.moves, {
                                get(target, prop) {
                                    if (prop === 'resolveChoice') {
                                        return (payload: any) => {
                                            const pending = G?.engine?.pendingChoice;
                                            if (pending?.sourceId === 'e2e_injected_pending_choice') {
                                                if (pending.choiceId !== payload.choiceId) {
                                                    return;
                                                }
                                                const hasSelection = payload && Object.prototype.hasOwnProperty.call(payload, 'selection');
                                                if (!hasSelection) {
                                                    return;
                                                }
                                                const api = (window as any).__BC_HOTSEAT_E2E__;
                                                if (api && typeof api.clearPendingChoice === 'function') {
                                                    api.clearPendingChoice();
                                                    injectedStateIdBumpRef.current += 1;
                                                }
                                                return;
                                            }
                                            return target[prop](payload);
                                        };
                                    }
                                    return target[prop as keyof typeof target];
                                }
                            })
                        }
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
