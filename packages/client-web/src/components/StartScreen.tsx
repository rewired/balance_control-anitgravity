import React, { useMemo } from 'react';
import { readLastSession, type LastSession } from '../lobby/session';
import type { StartSeatMode } from '../config/matchConfig';
import { fetchOllamaModels } from '../ollama/models';

interface StartScreenProps {
    onSelectHotseat: (config: { seatMode: StartSeatMode; model: string; availableModels: string[] }) => void;
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
    const [models, setModels] = React.useState<string[]>([]);
    const [model, setModel] = React.useState('');
    const [modelsError, setModelsError] = React.useState<string | null>(null);
    const [isLoadingModels, setIsLoadingModels] = React.useState(false);

    const loadModels = React.useCallback(async () => {
        setIsLoadingModels(true);
        setModelsError(null);
        try {
            const loadedModels = await fetchOllamaModels();
            setModels(loadedModels);
            if (loadedModels.length === 0) {
                setModel('');
                setModelsError('No Ollama models found. Please pull a model and refresh.');
                return;
            }
            setModel((current) => (loadedModels.includes(current) ? current : loadedModels[0]));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setModels([]);
            setModel('');
            setModelsError(message);
        } finally {
            setIsLoadingModels(false);
        }
    }, []);

    React.useEffect(() => {
        void loadModels();
    }, [loadModels]);

    const requiresBotModel = seatMode !== 'human-vs-human';
    const hasValidModel = !requiresBotModel || (model.length > 0 && models.includes(model));

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
                    {requiresBotModel && (
                        <div style={{ display: 'grid', gap: 6 }}>
                            <label style={{ display: 'grid', gap: 6 }}>
                                <span>KI-Modell (Ollama)</span>
                                <select
                                    className="lobby-input"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    data-testid="start-bot-model"
                                    disabled={models.length === 0 || isLoadingModels}
                                >
                                    {models.length === 0 ? (
                                        <option value="">No models available</option>
                                    ) : (
                                        models.map((entry) => (
                                            <option key={entry} value={entry}>
                                                {entry}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </label>
                            {modelsError && (
                                <div className="lobby-error" data-testid="start-model-error">
                                    {modelsError}
                                </div>
                            )}
                            <button
                                className="btn-secondary"
                                type="button"
                                onClick={() => void loadModels()}
                                disabled={isLoadingModels}
                                data-testid="start-refresh-models"
                            >
                                {isLoadingModels ? 'Refreshing models...' : 'Refresh models'}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                    <button
                        className="btn-primary"
                        onClick={() => onSelectHotseat({ seatMode, model, availableModels: models })}
                        disabled={!hasValidModel}
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
