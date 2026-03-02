import { normalizeGameConfig, type GameConfig } from '@balance-control/game';

export type StartSeatMode = 'human-vs-human' | 'human-vs-ai' | 'ai-vs-ai';

export function buildSeatConfig(mode: StartSeatMode, model: string): NonNullable<GameConfig['seats']> {
    const trimmedModel = model.trim();
    const botSeat = {
        role: 'bot' as const,
        provider: 'ollama' as const,
        model: trimmedModel || 'llama3.1:8b'
    };

    if (mode === 'human-vs-human') {
        return { '0': { role: 'human' }, '1': { role: 'human' } };
    }
    if (mode === 'human-vs-ai') {
        return { '0': { role: 'human' }, '1': botSeat };
    }
    return { '0': botSeat, '1': botSeat };
}

export function buildValidatedSetupData(input: {
    enabledPacks?: Array<'exp01' | 'exp02' | 'exp03'>;
    seatMode: StartSeatMode;
    model: string;
}): { packs: { enabledPacks: Array<'exp01' | 'exp02' | 'exp03'> }; seats: NonNullable<GameConfig['seats']> } {
    const setupData = {
        packs: { enabledPacks: input.enabledPacks ?? [] },
        seats: buildSeatConfig(input.seatMode, input.model)
    };

    // Reuse canonical game validation for client/server parity.
    normalizeGameConfig(setupData);
    return setupData;
}

