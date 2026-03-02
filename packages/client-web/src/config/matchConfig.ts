import { normalizeGameConfig, type GameConfig } from '@balance-control/game';

export type StartSeatMode = 'human-vs-human' | 'human-vs-ai' | 'ai-vs-ai';

function assertValidBotModel(mode: StartSeatMode, model: string, availableModels: readonly string[]): string {
    const trimmedModel = model.trim();
    if (mode === 'human-vs-human') {
        return trimmedModel;
    }

    if (!trimmedModel) {
        throw new Error('Bot seat requires a model selection.');
    }

    if (!availableModels.includes(trimmedModel)) {
        throw new Error(`Invalid bot model selection: ${trimmedModel}`);
    }

    return trimmedModel;
}

export function buildSeatConfig(
    mode: StartSeatMode,
    model: string,
    availableModels: readonly string[]
): NonNullable<GameConfig['seats']> {
    const validatedModel = assertValidBotModel(mode, model, availableModels);
    const botSeat = {
        role: 'bot' as const,
        provider: 'ollama' as const,
        model: validatedModel
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
    availableModels?: readonly string[];
}): { packs: { enabledPacks: Array<'exp01' | 'exp02' | 'exp03'> }; seats: NonNullable<GameConfig['seats']> } {
    const setupData = {
        packs: { enabledPacks: input.enabledPacks ?? [] },
        seats: buildSeatConfig(input.seatMode, input.model, input.availableModels ?? [])
    };

    // Reuse canonical game validation for client/server parity.
    normalizeGameConfig(setupData);
    return setupData;
}
