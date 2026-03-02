import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { StartScreen } from '../src/components/StartScreen';

describe('StartScreen model selection', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('loads Ollama models and allows bot mode start with select options', async () => {
        const onSelectHotseat = vi.fn();
        const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ models: [{ name: 'qwen2.5:7b' }, { name: 'llama3.1:8b' }] }), { status: 200 })
        );

        render(
            <StartScreen
                onSelectHotseat={onSelectHotseat}
                onSelectOnlineLobby={() => undefined}
                onResumeOnlineSession={() => undefined}
            />
        );

        fireEvent.change(screen.getByTestId('start-seat-mode'), { target: { value: 'ai-vs-ai' } });

        await waitFor(() => expect((screen.getByTestId('start-bot-model') as HTMLSelectElement).disabled).toBe(false));
        fireEvent.change(screen.getByTestId('start-bot-model'), { target: { value: 'qwen2.5:7b' } });

        const startButton = screen.getByTestId('start-hotseat') as HTMLButtonElement;
        expect(startButton.disabled).toBe(false);
        fireEvent.click(startButton);

        expect(onSelectHotseat).toHaveBeenCalledWith({
            seatMode: 'ai-vs-ai',
            model: 'qwen2.5:7b',
            availableModels: ['llama3.1:8b', 'qwen2.5:7b']
        });
    });

    it('shows error and disables bot start when no models are returned', async () => {
        const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ models: [] }), { status: 200 }));

        render(
            <StartScreen
                onSelectHotseat={() => undefined}
                onSelectOnlineLobby={() => undefined}
                onResumeOnlineSession={() => undefined}
            />
        );

        fireEvent.change(screen.getByTestId('start-seat-mode'), { target: { value: 'human-vs-ai' } });

        expect((await screen.findByTestId('start-model-error')).textContent).toContain('No Ollama models found');
        expect(screen.getByTestId('start-refresh-models')).toBeTruthy();
        expect((screen.getByTestId('start-hotseat') as HTMLButtonElement).disabled).toBe(true);
    });
});
