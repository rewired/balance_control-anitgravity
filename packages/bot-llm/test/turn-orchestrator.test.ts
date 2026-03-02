import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { runTurnOrchestrator } from '../src/turn-orchestrator';

const { selectIntentWithOllamaMock } = vi.hoisted(() => ({
    selectIntentWithOllamaMock: vi.fn()
}));

vi.mock('../src/adapter', () => ({
    selectIntentWithOllama: selectIntentWithOllamaMock
}));

function intent(moveType: string, payload: Record<string, unknown>): LegalIntent {
    return { moveType, payload };
}

const baseConfig = {
    ollama: {
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama3.1:8b',
        timeoutMs: 100
    }
};


describe('turn orchestrator', () => {
    beforeEach(() => {
        selectIntentWithOllamaMock.mockReset();
    });
    it('runs a full bot turn until active player changes', async () => {
        const snapshots = [
            { G: {} as any, ctx: { currentPlayer: '0' } },
            { G: {} as any, ctx: { currentPlayer: '0' } },
            { G: {} as any, ctx: { currentPlayer: '1' } }
        ];
        let snapshotIndex = 0;

        selectIntentWithOllamaMock
            .mockResolvedValueOnce({ selectedIntent: intent('placeTile', { targetCoord: [0, 0] }), selectedIndex: 0, usedFallback: false, reason: 'ok' })
            .mockResolvedValueOnce({ selectedIntent: intent('placeInfluence', { tileId: 'A' }), selectedIndex: 1, usedFallback: false, reason: 'ok' });

        const dispatched: string[] = [];
        const report = await runTurnOrchestrator({
            G: snapshots[0].G,
            ctx: snapshots[0].ctx,
            playerID: '0',
            config: { ...baseConfig, maxTurns: 1, maxConsecutiveBotActions: 5 },
            dispatchIntent: async (nextIntent) => {
                dispatched.push(nextIntent.moveType);
                snapshotIndex += 1;
            },
            getLatestSnapshot: () => snapshots[snapshotIndex] ?? snapshots[snapshots.length - 1],
            isBotPlayer: (playerID) => playerID === '0'
        });

        expect(dispatched).toEqual(['placeTile', 'placeInfluence']);
        expect(report.actionsDispatched).toBe(2);
        expect(report.turnsCompleted).toBe(1);
        expect(report.stoppedReason).toBe('active-player-not-bot');
    });

    it('stops deterministically when no legal moves are available', async () => {
        selectIntentWithOllamaMock.mockResolvedValueOnce({
            selectedIntent: null,
            selectedIndex: -1,
            usedFallback: true,
            reason: 'no-legal-moves'
        });

        const dispatchIntent = vi.fn();
        const report = await runTurnOrchestrator({
            G: {} as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            config: baseConfig,
            dispatchIntent
        });

        expect(dispatchIntent).not.toHaveBeenCalled();
        expect(report.stoppedReason).toBe('no-legal-moves');
        expect(report.actionsDispatched).toBe(0);
    });

    it('enforces max consecutive bot actions guard for bot-vs-bot loops', async () => {
        selectIntentWithOllamaMock.mockResolvedValue({
            selectedIntent: intent('placeTile', { targetCoord: [0, 0] }),
            selectedIndex: 0,
            usedFallback: false,
            reason: 'ok'
        });

        const report = await runTurnOrchestrator({
            G: {} as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            config: { ...baseConfig, maxTurns: 10, maxConsecutiveBotActions: 2 },
            dispatchIntent: async () => ({ G: {} as any, ctx: { currentPlayer: '1' } }),
            isBotPlayer: () => true
        });

        expect(report.stoppedReason).toBe('max-consecutive-bot-actions-reached');
        expect(report.actionsDispatched).toBe(2);
    });
});
