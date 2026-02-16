import React, { useMemo } from 'react';
import { readLastSession, type LastSession } from '../lobby/session';

interface StartScreenProps {
    onSelectHotseat: () => void;
    onSelectOnlineLobby: () => void;
    onResumeOnlineSession: (session: LastSession) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
    onSelectHotseat,
    onSelectOnlineLobby,
    onResumeOnlineSession
}) => {
    const lastSession = useMemo(() => readLastSession(), []);

    return (
        <div className="start-screen" data-testid="start-screen">
            <div className="glass-panel" style={{ padding: 16, maxWidth: 520, margin: '24px auto' }}>
                <h2 style={{ marginTop: 0 }}>BALANCE // CONTROL</h2>
                <p style={{ marginTop: 8, opacity: 0.9 }}>Choose a mode to begin.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    <button className="btn-primary" onClick={onSelectHotseat} data-testid="start-hotseat">
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

