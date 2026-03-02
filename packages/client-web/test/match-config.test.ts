import { describe, expect, it } from 'vitest';
import { buildValidatedSetupData } from '../src/config/matchConfig';

describe('match bot seat config', () => {
    it('builds human vs ai setup data', () => {
        const data = buildValidatedSetupData({
            seatMode: 'human-vs-ai',
            model: 'llama3.1:8b',
            availableModels: ['llama3.1:8b']
        });
        expect(data.seats['0']).toEqual({ role: 'human' });
        expect(data.seats['1']).toEqual({
            role: 'bot',
            provider: 'ollama',
            model: 'llama3.1:8b'
        });
    });

    it('builds ai vs ai setup data with canonical schema', () => {
        const data = buildValidatedSetupData({
            seatMode: 'ai-vs-ai',
            model: 'qwen2.5:7b',
            availableModels: ['qwen2.5:7b']
        });
        expect(data.seats['0']).toEqual({ role: 'bot', provider: 'ollama', model: 'qwen2.5:7b' });
        expect(data.seats['1']).toEqual({ role: 'bot', provider: 'ollama', model: 'qwen2.5:7b' });
    });

    it('rejects ai modes when the selected model is not in loaded models', () => {
        expect(() =>
            buildValidatedSetupData({
                seatMode: 'human-vs-ai',
                model: 'llama3.1:8b',
                availableModels: ['qwen2.5:7b']
            })
        ).toThrow('Invalid bot model selection: llama3.1:8b');

        expect(() =>
            buildValidatedSetupData({
                seatMode: 'ai-vs-ai',
                model: 'llama3.1:8b',
                availableModels: []
            })
        ).toThrow('Invalid bot model selection: llama3.1:8b');
    });
});
