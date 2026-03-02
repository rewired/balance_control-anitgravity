import React, { useMemo } from 'react';
import { readLastSession, type LastSession } from '../lobby/session';
import type { StartSeatMode } from '../config/matchConfig';

interface StartScreenProps {
    onSelectHotseat: (config: { seatMode: StartSeatMode; model: string }) => void;
    onSelectOnlineLobby: () => void;
    onResumeOnlineSession: (session: LastSession) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
    onSelectHotseat,
    onSelectOnlineLobby,
    onResumeOnlineSession
}) => {
    const lastSession = useMemo(() => readLastSession(), []);
    const [seatMode, setSeatMode] = React.useState<StartSeatMode>('human-vs-human');
    const [model, setModel] = React.useState('llama3.1:8b');

    return (
        <div className="start-screen" data-testid="start-screen">
            <div className="glass-panel" style={{ padding: 16, maxWidth: 520, margin: '24px auto' }}>
                <h2 style={{ marginTop: 0 }}>BALANCE // CONTROL</h2>
                <p style={{ marginTop: 8, opacity: 0.9 }}>Choose a mode to begin.</p>

                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span>Seat setup</span>
                        <select
                            className="lobby-input"
                            value={seatMode}
                            onChange={(e) => setSeatMode(e.target.value as StartSeatMode)}
                            data-testid="start-seat-mode"
                        >
                            <option value="human-vs-human">Mensch vs Mensch</option>
                            <option value="human-vs-ai">Mensch vs KI</option>
                            <option value="ai-vs-ai">KI vs KI</option>
                        </select>
                    </label>
                    {seatMode !== 'human-vs-human' && (
                        <label style={{ display: 'grid', gap: 6 }}>
                            <span>KI-Modell (Ollama)</span>
                            <input
                                className="lobby-input"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                data-testid="start-bot-model"
                            />
                        </label>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    <button
                        className="btn-primary"
                        onClick={() => onSelectHotseat({ seatMode, model })}
                        data-testid="start-hotseat"
                    >
                        Local hotseat (2p)
                    </button>
                    <button className="btn-secondary" onClick={onSelectOnlineLobby} data-testid="start-online-lobby">
                        Online lobby
                    </button>
                    {lastSession && (
                        <button
                            className="btn-secondary"
                            onClick={() => onResumeOnlineSession(lastSession)}
                            data-testid="start-resume-online"
                        >
                            Resume online session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
