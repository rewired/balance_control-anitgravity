import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { BalanceControl } from '@balance-control/game';
import { Board } from './Board';
import { LobbyScreen, type LobbyJoinPayload } from './components/LobbyScreen';

type MoveLogEntry = {
    timestamp?: number;
    playerID: string | null;
    moveName: string;
    payload: any;
    stateID_before: number | null;
    stateID_after: number | null;
};

const DEBUG_REPLAY = import.meta.env.VITE_DEBUG_REPLAY === '1';
const REPLAY_RING_SIZE = 200;
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000';
const GAME_NAME = BalanceControl.name;

function getStateID(state: any): number | null {
    if (!state) return null;
    return state.ctx?._stateID ?? state.ctx?.stateID ?? state._stateID ?? null;
}

function getReplayConfig(state: any): any {
    const expansions = state?.G?.engine?.attributes?.enabledExpansions;
    if (!expansions) return undefined;
    return { expansions };
}

function getReplaySeed(state: any): string | number | null {
    return state?.ctx?.randomSeed ?? state?.ctx?._randomSeed ?? null;
}

const App: React.FC = () => {
    const lobbyClient = useMemo(() => new LobbyClient({ server: SERVER_URL }), []);
    const [session, setSession] = useState<LobbyJoinPayload | null>(null);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    const client = useMemo(() => {
        if (!session) return null;
        return Client({
            game: BalanceControl,
            multiplayer: SocketIO({ server: SERVER_URL }),
            matchID: session.matchID,
            playerID: session.playerID,
            credentials: session.credentials,
        });
    }, [session]);

    const [state, setState] = useState<any>(null);
    const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
    const pendingMovesRef = useRef<MoveLogEntry[]>([]);
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        if (!client) {
            setState(null);
            return;
        }
        client.start();
        setState(client.getState());
        const unsubscribe = client.subscribe((nextState: any) => {
            setState(nextState);
            if (DEBUG_REPLAY && pendingMovesRef.current.length > 0) {
                const entry = pendingMovesRef.current.shift()!;
                entry.stateID_after = getStateID(nextState);
                setMoveLog((prev) => [...prev, entry].slice(-REPLAY_RING_SIZE));
            }
        });
        return () => {
            unsubscribe();
            client.stop();
        };
    }, [client]);

    useEffect(() => {
        if (state?.isConnected) {
            wasConnectedRef.current = true;
        }
    }, [state?.isConnected]);

    const moves = useMemo(() => {
        if (!client || !session) return {};
        const wrapped: Record<string, (...args: any[]) => void> = {};
        for (const [name, fn] of Object.entries(client.moves)) {
            wrapped[name] = (...args: any[]) => {
                if (DEBUG_REPLAY) {
                    const beforeState = client.getState();
                    const payload = args.length <= 1 ? (args[0] ?? null) : args;
                    pendingMovesRef.current.push({
                        timestamp: Date.now(),
                        playerID: session.playerID,
                        moveName: name,
                        payload,
                        stateID_before: getStateID(beforeState),
                        stateID_after: null
                    });
                }
                (fn as any)(...args);
            };
        }
        return wrapped;
    }, [client, session?.playerID]);

    const replayPayload = useMemo(() => {
        return {
            gameName: BalanceControl.name,
            gameVersion: 'dev',
            seed: getReplaySeed(state),
            numPlayers: state?.ctx?.numPlayers ?? 2,
            config: getReplayConfig(state),
            rulesetManifest: state?.G?.meta?.ruleset,
            moves: moveLog.map((entry) => ({
                timestamp: entry.timestamp,
                playerID: entry.playerID,
                move: entry.moveName,
                payload: entry.payload,
                stateID_before: entry.stateID_before,
                stateID_after: entry.stateID_after
            }))
        };
    }, [moveLog, state]);

    const handleCopyReplay = async () => {
        const text = JSON.stringify(replayPayload, null, 2);
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        }
    };

    const handleJoin = (payload: LobbyJoinPayload) => {
        pendingMovesRef.current = [];
        setMoveLog([]);
        wasConnectedRef.current = false;
        setLeaveError(null);
        setSession(payload);
    };

    const handleQuitGame = async () => {
        if (!session) return;
        setIsLeaving(true);
        setLeaveError(null);
        try {
            await lobbyClient.leaveMatch(GAME_NAME, session.matchID, {
                playerID: session.playerID,
                credentials: session.credentials,
            });
            pendingMovesRef.current = [];
            setMoveLog([]);
            wasConnectedRef.current = false;
            setSession(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setLeaveError(`Failed to leave match: ${message}`);
        } finally {
            setIsLeaving(false);
        }
    };

    if (!session) {
        return <LobbyScreen onJoin={handleJoin} />;
    }

    if (!state) return null;

    const playerID = session.playerID;
    const matchID = session.matchID;

    const isConnected = state?.isConnected ?? true;
    const ctx = state?.ctx;
    const gameover = Boolean(ctx?.gameover);
    const isMyTurn = ctx?.currentPlayer === playerID;
    const isActiveByStage = Boolean(ctx?.activePlayers?.[playerID]);
    const isActive = isConnected && !gameover && (isMyTurn || isActiveByStage);
    const connectionLabel = isConnected ? 'Connected' : (wasConnectedRef.current ? 'Disconnected' : 'Connecting');

    return (
        <>
            <div className="game-topbar glass-panel" data-testid="game-topbar">
                <div className="game-topbar-text">
                    {connectionLabel} | Match {matchID} | Player {playerID}
                </div>
                <button
                    className="btn-secondary"
                    onClick={() => void handleQuitGame()}
                    disabled={isLeaving}
                    data-testid="quit-game"
                >
                    {isLeaving ? 'Quitting...' : 'Quit game'}
                </button>
            </div>
            {leaveError && (
                <div className="game-topbar-error glass-panel" data-testid="quit-error">
                    {leaveError}
                </div>
            )}
            <div data-testid="game-screen">
                <Board
                    G={state.G}
                    ctx={state.ctx}
                    moves={moves}
                    playerID={playerID}
                    isActive={isActive}
                />
            </div>
            {DEBUG_REPLAY && (
                <div className="debug-replay-panel">
                    <div className="debug-replay-title">Replay Debug</div>
                    <div className="debug-replay-meta">Moves: {moveLog.length}</div>
                    <button className="btn-secondary" onClick={handleCopyReplay}>
                        Copy replay JSON
                    </button>
                </div>
            )}
        </>
    );
};

export default App;
