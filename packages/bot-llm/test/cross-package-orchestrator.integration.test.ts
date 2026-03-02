import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from 'boardgame.io/client';
import { createBalanceControlGame, enumerateLegalIntents, hashState, EnginePackRegistry, type LegalIntent } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';
import { runTurnOrchestrator } from '../src/turn-orchestrator';
import type { OllamaRequestConfig } from '../src/ollama-client';


function makeOllamaConfig(responses: string[] | Error[]): OllamaRequestConfig {
    let call = 0;
    const httpClient = vi.fn<typeof fetch>().mockImplementation(async () => {
        const next = responses[call] ?? responses[responses.length - 1] ?? JSON.stringify({ selectedIndex: 0 });
        call += 1;
        if (next instanceof Error) {
            throw next;
        }
        return {
            ok: true,
            json: async () => ({ response: next })
        } as Response;
    });

    return {
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama3.1:8b',
        timeoutMs: 50,
        httpClient
    };
}

function dispatchFromIntent(client: ReturnType<typeof Client>, intent: LegalIntent): void {
    const move = (client.moves as Record<string, (payload: unknown) => void>)[intent.moveType];
    expect(move).toBeTypeOf('function');
    move(intent.payload);
}

function createTwoPlayerClient(seed: string): ReturnType<typeof Client> {
    EnginePackRegistry.clear();
    registerCanonicalPacks();

    const baseGame = createBalanceControlGame();
    const deterministicGame = {
        ...baseGame,
        seed,
        playerView: ({ G }: any) => G,
        setup: (ctx: any) => {
            const G = baseGame.setup(ctx, undefined);
            G.engine.attributes.startingPlayerIndex = 0;
            return G;
        }
    };

    const client = Client({
        game: deterministicGame,
        numPlayers: 2
    });
    client.start();
    return client;
}

function runDeterministicMirrorSimulation(seed: string, responses: string[]): Promise<string> {
    const client = createTwoPlayerClient(seed);
    const config = makeOllamaConfig(responses);

    return hashAfterBotCycle(client, config, {
        maxTurns: 2,
        maxConsecutiveBotActions: 8,
        isBotPlayer: () => true,
        expectedStopReason: 'max-turns-reached'
    });
}

function hashAfterBotCycle(
    client: ReturnType<typeof Client>,
    ollama: OllamaRequestConfig,
    options: {
        maxTurns: number;
        maxConsecutiveBotActions: number;
        isBotPlayer: (playerID: string) => boolean;
        expectedStopReason: 'max-turns-reached' | 'active-player-not-bot' | 'max-consecutive-bot-actions-reached';
    }
): string {
    const before = client.getState();
    if (!before) {
        throw new Error('missing boardgame state');
    }

    return runTurnOrchestrator({
        G: before.G,
        ctx: before.ctx,
        playerID: before.ctx.currentPlayer,
        config: {
            ollama,
            maxTurns: options.maxTurns,
            maxConsecutiveBotActions: options.maxConsecutiveBotActions
        },
        dispatchIntent: (intent) => {
            const snapshot = client.getState();
            if (!snapshot) {
                throw new Error('missing snapshot before dispatch');
            }

            const legal = enumerateLegalIntents(snapshot.G, snapshot.ctx, snapshot.ctx.currentPlayer);
            expect(legal).toContainEqual(intent);
            dispatchFromIntent(client, intent);
        },
        getLatestSnapshot: () => {
            const latest = client.getState();
            if (!latest) {
                throw new Error('missing latest snapshot');
            }
            return { G: latest.G, ctx: latest.ctx };
        },
        isBotPlayer: options.isBotPlayer
    }).then((report) => {
        expect(report.stoppedReason).toBe(options.expectedStopReason);
        const after = client.getState();
        expect(after).toBeTruthy();
        return hashState(after!.G as any);
    });
}

describe('cross-package bot/game orchestration', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
        registerCanonicalPacks();
    });

    it('Mensch vs KI: bot executes a legal move from index-only response', async () => {
        const client = createTwoPlayerClient('human-vs-bot-seed');
        const start = client.getState()!;
        const humanPlayer = start.ctx.currentPlayer;
        const botPlayer = humanPlayer === '0' ? '1' : '0';

        let current = start;
        for (let i = 0; i < 6 && current.ctx.currentPlayer !== botPlayer; i += 1) {
            const humanLegal = enumerateLegalIntents(current.G, current.ctx, current.ctx.currentPlayer);
            expect(humanLegal.length).toBeGreaterThan(0);
            dispatchFromIntent(client, humanLegal[0]);
            current = client.getState()!;
        }
        expect(current.ctx.currentPlayer).toBe(botPlayer);

        const config = makeOllamaConfig([JSON.stringify({ selectedIndex: 0 })]);
        const report = await runTurnOrchestrator({
            G: current.G,
            ctx: current.ctx,
            playerID: botPlayer,
            config: { ollama: config, maxTurns: 1, maxConsecutiveBotActions: 4 },
            dispatchIntent: (intent) => {
                const snapshot = client.getState()!;
                const legal = enumerateLegalIntents(snapshot.G, snapshot.ctx, botPlayer);
                expect(legal).toContainEqual(intent);
                dispatchFromIntent(client, intent);
            },
            getLatestSnapshot: () => ({ G: client.getState()!.G, ctx: client.getState()!.ctx }),
            isBotPlayer: (playerID) => playerID === botPlayer
        });

        expect(report.actionsDispatched).toBeGreaterThan(0);
        expect(report.stoppedReason).toBe('active-player-not-bot');
    });

    it('KI vs KI: performs multiple actions without invalid-move/deadlock', async () => {
        const client = createTwoPlayerClient('bot-vs-bot-seed');
        const hash = await hashAfterBotCycle(client, makeOllamaConfig([JSON.stringify({ selectedIndex: 0 })]), {
            maxTurns: 2,
            maxConsecutiveBotActions: 8,
            isBotPlayer: () => true,
            expectedStopReason: 'max-turns-reached'
        });

        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('Ollama invalid-response and timeout use deterministic fallback (index 0 only)', async () => {
        for (const response of [JSON.stringify({ selectedIndex: 0, payload: { forged: true } }), new Error('timeout')]) {
            const client = createTwoPlayerClient(`fallback-${String(response)}`);
            const before = client.getState()!;
            const legal = enumerateLegalIntents(before.G, before.ctx, before.ctx.currentPlayer);
            expect(legal.length).toBeGreaterThan(0);

            const chosen: LegalIntent[] = [];
            const report = await runTurnOrchestrator({
                G: before.G,
                ctx: before.ctx,
                playerID: before.ctx.currentPlayer,
                config: {
                    ollama: makeOllamaConfig([response]),
                    maxTurns: 1,
                    maxConsecutiveBotActions: 1
                },
                dispatchIntent: (intent) => {
                    chosen.push(intent);
                    dispatchFromIntent(client, intent);
                },
                getLatestSnapshot: () => ({ G: client.getState()!.G, ctx: client.getState()!.ctx }),
                isBotPlayer: () => true
            });

            expect(report.actionsDispatched).toBe(1);
            expect(chosen[0]).toEqual(legal[0]);
            expect(report.lastSelection?.selectedIndex).toBe(0);
            expect(report.lastSelection?.usedFallback).toBe(true);
        }
    });

    it('Determinism: same seed + same mock LLM responses => same final state hash', async () => {
        const responses = Array.from({ length: 8 }, () => JSON.stringify({ selectedIndex: 0 }));
        const first = await runDeterministicMirrorSimulation('determinism-seed', responses);
        const second = await runDeterministicMirrorSimulation('determinism-seed', responses);

        expect(first).toBe(second);
    });
});
