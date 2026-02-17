import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LobbyClient } from 'boardgame.io/client';
import { GAME_NAME } from '../game';
import { clearLastSession, readLastSession, type LastSession } from '../lobby/session';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8000';

export type LobbyJoinPayload = {
    matchID: string;
    playerID: string;
    credentials: string;
    playerName: string;
    serverUrl: string;
};

interface LobbyScreenProps {
    onJoin: (payload: LobbyJoinPayload) => void;
}

type LobbyMatchPlayer = {
    id: number | string;
    name?: string;
};

type LobbyMatch = {
    matchID: string;
    players: LobbyMatchPlayer[];
    setupData?: unknown;
    gameover?: unknown;
};

type ExpansionFlags = {
    ex01: boolean;
    ex02: boolean;
    ex03: boolean;
};

function getExpansionsLabel(setupData: unknown): string {
    if (!setupData || typeof setupData !== 'object') return 'None';
    const source = setupData as Record<string, unknown>;
    const expansions = (source.expansions ?? (source.config as any)?.expansions ?? null) as Record<string, unknown> | null;
    if (!expansions || typeof expansions !== 'object') return 'None';
    const enabled: string[] = [];
    if (expansions.ex01 === true) enabled.push('EXP-01');
    if (expansions.ex02 === true) enabled.push('EXP-02');
    if (expansions.ex03 === true) enabled.push('EXP-03');
    return enabled.length ? enabled.join(', ') : 'None';
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoin }) => {
    const lobbyClient = useMemo(() => new LobbyClient({ server: SERVER_URL }), []);
    const [matches, setMatches] = useState<LobbyMatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lastSession, setLastSession] = useState<LastSession | null>(() => readLastSession());
    const [isLeavingLastSession, setIsLeavingLastSession] = useState(false);
    const [leaveLastSessionError, setLeaveLastSessionError] = useState<string | null>(null);

    const [playerName, setPlayerName] = useState('');
    const [numPlayers, setNumPlayers] = useState(2);
    const [expansions, setExpansions] = useState<ExpansionFlags>({ ex01: false, ex02: false, ex03: false });
    const [isCreating, setIsCreating] = useState(false);
    const [joiningSeat, setJoiningSeat] = useState<{ matchID: string; playerID: string } | null>(null);

    const loadMatches = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await lobbyClient.listMatches(GAME_NAME);
            const next = Array.isArray((result as any)?.matches) ? ((result as any).matches as LobbyMatch[]) : [];
            setMatches(next);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to load matches: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [lobbyClient]);

    useEffect(() => {
        void loadMatches();
    }, [loadMatches]);

    const handleCreateMatch = async () => {
        setIsCreating(true);
        setError(null);
        try {
            await lobbyClient.createMatch(GAME_NAME, {
                numPlayers,
                setupData: { expansions }
            });
            await loadMatches();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to create match: ${message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinSeat = async (matchID: string, seatPlayerID: string) => {
        const name = playerName.trim();
        if (!name) {
            setError('Please enter a player name before joining.');
            return;
        }

        setJoiningSeat({ matchID, playerID: seatPlayerID });
        setError(null);
        try {
            const result = await lobbyClient.joinMatch(GAME_NAME, matchID, {
                playerID: seatPlayerID,
                playerName: name
            });
            const credentials = (result as any)?.playerCredentials as string | undefined;
            const joinedPlayerID = ((result as any)?.playerID ?? seatPlayerID) as string;
            if (!credentials) {
                throw new Error('Lobby join did not return playerCredentials.');
            }
            onJoin({ matchID, playerID: joinedPlayerID, credentials, playerName: name, serverUrl: SERVER_URL });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to join match: ${message}`);
        } finally {
            setJoiningSeat(null);
        }
    };

    const handleResumeLastMatch = () => {
        if (!lastSession) return;
        setLeaveLastSessionError(null);
        onJoin(lastSession);
    };

    const handleLeaveLastMatch = async () => {
        if (!lastSession) return;
        setIsLeavingLastSession(true);
        setLeaveLastSessionError(null);
        try {
            const sessionLobbyClient = new LobbyClient({ server: lastSession.serverUrl });
            await sessionLobbyClient.leaveMatch(GAME_NAME, lastSession.matchID, {
                playerID: lastSession.playerID,
                credentials: lastSession.credentials,
            });
            clearLastSession();
            setLastSession(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setLeaveLastSessionError(`Failed to leave match: ${message}`);
        } finally {
            setIsLeavingLastSession(false);
        }
    };

    const handleForceForget = () => {
        clearLastSession();
        setLastSession(null);
        setLeaveLastSessionError(null);
    };

    return (
        <div className="lobby-screen" data-testid="lobby-screen">
            <div className="lobby-header glass-panel">
                <div className="lobby-title">Lobby</div>
                <div className="lobby-subtitle">
                    Game: {GAME_NAME} | Server: {SERVER_URL}
                </div>
                {lastSession && (
                    <div className="lobby-last-session glass-panel" data-testid="lobby-last-session">
                        <div className="lobby-last-session-title">Last session</div>
                        <div className="lobby-last-session-meta">
                            Match {lastSession.matchID} | Player {lastSession.playerID} | Name {lastSession.playerName} | Server{' '}
                            {lastSession.serverUrl}
                        </div>
                        <div className="lobby-last-session-actions">
                            <button
                                className="btn-primary"
                                onClick={handleResumeLastMatch}
                                disabled={isLeavingLastSession}
                                data-testid="lobby-resume-last-match"
                            >
                                Resume last match
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => void handleLeaveLastMatch()}
                                disabled={isLeavingLastSession}
                                data-testid="lobby-leave-last-match"
                            >
                                {isLeavingLastSession ? 'Leaving...' : 'Leave'}
                            </button>
                            {leaveLastSessionError && (
                                <div className="lobby-error" data-testid="lobby-leave-last-match-error">
                                    {leaveLastSessionError}
                                </div>
                            )}
                            {leaveLastSessionError && (
                                <button
                                    className="btn-secondary"
                                    onClick={handleForceForget}
                                    disabled={isLeavingLastSession}
                                    data-testid="lobby-force-forget"
                                >
                                    Force forget
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <div className="lobby-row">
                    <label className="lobby-field">
                        <span className="lobby-label">Player name</span>
                        <input
                            className="lobby-input"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="e.g. Alice"
                            data-testid="lobby-player-name"
                        />
                    </label>
                    <button className="btn-secondary" onClick={loadMatches} disabled={isLoading}>
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                {error && (
                    <div className="lobby-error" data-testid="lobby-error">
                        {error}
                    </div>
                )}
            </div>

            <div className="lobby-columns">
                <section className="lobby-panel glass-panel">
                    <h3>Create match</h3>
                    <div className="lobby-form">
                        <label className="lobby-field">
                            <span className="lobby-label">Players</span>
                            <select
                                className="lobby-input"
                                value={numPlayers}
                                onChange={(e) => setNumPlayers(parseInt(e.target.value, 10))}
                                data-testid="lobby-num-players"
                            >
                                {[2, 3, 4, 5, 6].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="lobby-field">
                            <span className="lobby-label">Expansions</span>
                            <div className="lobby-checkboxes">
                                <label className="lobby-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={expansions.ex01}
                                        onChange={(e) => setExpansions((prev) => ({ ...prev, ex01: e.target.checked }))}
                                    />
                                    EXP-01
                                </label>
                                <label className="lobby-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={expansions.ex02}
                                        onChange={(e) => setExpansions((prev) => ({ ...prev, ex02: e.target.checked }))}
                                    />
                                    EXP-02
                                </label>
                                <label className="lobby-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={expansions.ex03}
                                        onChange={(e) => setExpansions((prev) => ({ ...prev, ex03: e.target.checked }))}
                                    />
                                    EXP-03
                                </label>
                            </div>
                        </div>

                        <div className="lobby-field">
                            <span className="lobby-label">Player type</span>
                            <select className="lobby-input" disabled>
                                <option>TODO (human/network/ai)</option>
                            </select>
                        </div>

                        <div className="lobby-field">
                            <span className="lobby-label">Rule variants</span>
                            <input className="lobby-input" disabled value="TODO" />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleCreateMatch}
                            disabled={isCreating}
                            data-testid="lobby-create-match"
                        >
                            {isCreating ? 'Creating...' : 'Create match'}
                        </button>
                    </div>
                </section>

                <section className="lobby-panel glass-panel">
                    <h3>Matches</h3>
                    {matches.length === 0 && !isLoading && (
                        <div className="lobby-empty" data-testid="lobby-empty">
                            No matches found.
                        </div>
                    )}
                    <div className="lobby-match-list">
                        {matches.map((match) => {
                            const players = Array.isArray(match.players) ? match.players.slice() : [];
                            players.sort((a, b) => Number(a.id) - Number(b.id));
                            return (
                                <div key={match.matchID} className="lobby-match" data-testid={`lobby-match-${match.matchID}`}>
                                    <div className="lobby-match-header">
                                        <div className="lobby-match-title">Match {match.matchID}</div>
                                        <div className="lobby-match-meta">Expansions: {getExpansionsLabel(match.setupData)}</div>
                                    </div>
                                    <div className="lobby-seats">
                                        {players.map((p) => {
                                            const seatId = String(p.id);
                                            const occupied = typeof p.name === 'string' && p.name.trim().length > 0;
                                            const isJoining = joiningSeat?.matchID === match.matchID && joiningSeat?.playerID === seatId;
                                            return (
                                                <div key={seatId} className="lobby-seat" data-testid={`lobby-seat-${match.matchID}-${seatId}`}>
                                                    <div className="lobby-seat-label">Seat {seatId}</div>
                                                    <div className="lobby-seat-value">{occupied ? p.name : 'Empty'}</div>
                                                    {!occupied && (
                                                        <button
                                                            className="btn-primary"
                                                            onClick={() => void handleJoinSeat(match.matchID, seatId)}
                                                            disabled={!playerName.trim() || Boolean(joiningSeat)}
                                                            data-testid={`lobby-join-${match.matchID}-${seatId}`}
                                                        >
                                                            {isJoining ? 'Joining...' : 'Join'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};
