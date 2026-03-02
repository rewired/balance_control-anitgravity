import { describe, expect, it, vi } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { dispatchIntentToMoves, isBotPlayer, runBotOrchestratorForSnapshot } from '../src/bot/orchestratorBridge';

const { runTurnOrchestratorMock } = vi.hoisted(() => ({
    runTurnOrchestratorMock: vi.fn()
}));

vi.mock('../../bot-llm/src/turn-orchestrator', () => ({
    runTurnOrchestrator: runTurnOrchestratorMock,
}));

describe('bot orchestrator bridge', () => {
    it('derives bot seats from G.meta.cfg.seats and runs ai-vs-ai orchestration', async () => {
        const dispatchSpy = vi.fn(async () => undefined);

        const snapshot = {
            G: {
                meta: {
                    cfg: {
                        seats: {
                            '0': { role: 'bot', provider: 'ollama', model: 'llama3.1:8b' },
                            '1': { role: 'bot', provider: 'ollama', model: 'llama3.1:8b' }
                        }
                    }
                }
            },
            ctx: { currentPlayer: '0' }
        } as any;

        runTurnOrchestratorMock.mockImplementation(async (params: any) => {
            await params.dispatchIntent({ moveType: 'placeInfluence', payload: { targetTileId: 'tile_1' } }, { playerID: '0' });
            return { stoppedReason: 'active-player-not-bot' };
        });

        await runBotOrchestratorForSnapshot({
            snapshot,
            dispatchIntentToMoves: async (intent: LegalIntent) => {
                dispatchSpy(intent);
            },
            getLatestSnapshot: () => snapshot
        });

        expect(isBotPlayer(snapshot, '0')).toBe(true);
        expect(isBotPlayer(snapshot, '1')).toBe(true);
        expect(dispatchSpy).toHaveBeenCalledWith({ moveType: 'placeInfluence', payload: { targetTileId: 'tile_1' } });
        expect(runTurnOrchestratorMock).toHaveBeenCalledWith(
            expect.objectContaining({
                playerID: '0',
                config: expect.objectContaining({
                    maxTurns: 12,
                    maxConsecutiveBotActions: 48,
                    ollama: expect.objectContaining({ model: 'llama3.1:8b' })
                })
            })
        );
    });

    it('maps dispatch bridge to existing client moves', () => {
        const moveFn = vi.fn();
        dispatchIntentToMoves({ placeInfluence: moveFn }, { moveType: 'placeInfluence', payload: { targetTileId: 'tile_1' } } as any);
        expect(moveFn).toHaveBeenCalledWith({ targetTileId: 'tile_1' });
    });
});
