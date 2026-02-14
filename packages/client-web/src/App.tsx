import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Client, SocketIO } from 'boardgame.io/client';
import { BalanceControl } from '@balance-control/game';
import { Board } from './Board';

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
const MULTIPLAYER_MODE = import.meta.env.VITE_MULTIPLAYER ?? 'local';
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000';

function getRuntimeParams() {
    const params = new URLSearchParams(window.location.search);
    const playerID = params.get('player') ?? import.meta.env.VITE_PLAYER_ID ?? '0';
    const matchID = params.get('match') ?? import.meta.env.VITE_MATCH_ID ?? 'default';
    return { playerID, matchID };
}

function createClient(playerID: string, matchID: string) {
    if (MULTIPLAYER_MODE === 'server') {
        return Client({
            game: BalanceControl,
            numPlayers: 2,
            multiplayer: SocketIO({ server: SERVER_URL }),
            matchID,
            playerID
        });
    }
    return Client({
        game: BalanceControl,
        numPlayers: 2,
        playerID
    });
}

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
    const [{ playerID, matchID }] = useState(getRuntimeParams);
    const client = useMemo(() => createClient(playerID, matchID), [playerID, matchID]);
    const [state, setState] = useState<any>(client.getState());
    const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
    const pendingMovesRef = useRef<MoveLogEntry[]>([]);
    const wasConnectedRef = useRef(false);

    useEffect(() => {
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
        const wrapped: Record<string, (...args: any[]) => void> = {};
        for (const [name, fn] of Object.entries(client.moves)) {
            wrapped[name] = (...args: any[]) => {
                if (DEBUG_REPLAY) {
                    const beforeState = client.getState();
                    const payload = args.length <= 1 ? (args[0] ?? null) : args;
                    pendingMovesRef.current.push({
                        timestamp: Date.now(),
                        playerID,
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
    }, [playerID]);

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

    if (!state) return null;

    const isConnected = state?.isConnected ?? true;
    const isActive = Boolean(state?.isActive) && isConnected;
    const connectionLabel = MULTIPLAYER_MODE === 'server'
        ? (isConnected ? 'Connected' : (wasConnectedRef.current ? 'Disconnected' : 'Connecting'))
        : 'Local';

    return (
        <>
            {MULTIPLAYER_MODE === 'server' && (
                <div className="connection-status">
                    {connectionLabel} · Match {matchID} · Player {playerID}
                </div>
            )}
            <Board
                G={state.G}
                ctx={state.ctx}
                moves={moves}
                playerID={playerID}
                isActive={isActive}
            />
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
