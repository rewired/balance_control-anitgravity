import { runTurnOrchestrator, type TurnOrchestratorConfig, type TurnOrchestratorSnapshot } from '../../../bot-llm/src/turn-orchestrator';
import type { LegalIntent } from '@balance-control/game';
import { INVALID_MOVE } from 'boardgame.io/core';
import type { GameConfig, SeatConfig } from '@balance-control/rules';

const DEFAULT_OLLAMA_ENDPOINT = import.meta.env.VITE_OLLAMA_ENDPOINT ?? 'http://127.0.0.1:11434/api/generate';
const DEFAULT_OLLAMA_TIMEOUT_MS = Number(import.meta.env.VITE_OLLAMA_TIMEOUT_MS ?? 10_000);

export function getSeatsFromSnapshot(snapshot: TurnOrchestratorSnapshot): NonNullable<GameConfig['seats']> {
    const cfg = snapshot.G?.meta?.cfg;
    const seats = cfg?.seats;
    return seats && typeof seats === 'object' ? seats : {};
}

export function isBotSeat(seat: SeatConfig | undefined): boolean {
    return seat?.role === 'bot' && seat.provider === 'ollama' && typeof seat.model === 'string' && seat.model.length > 0;
}

export function isBotPlayer(snapshot: TurnOrchestratorSnapshot, playerID: string): boolean {
    const seats = getSeatsFromSnapshot(snapshot);
    return isBotSeat(seats[playerID]);
}

function resolveBotConfig(snapshot: TurnOrchestratorSnapshot, playerID: string): TurnOrchestratorConfig | null {
    const seat = getSeatsFromSnapshot(snapshot)[playerID];
    if (!isBotSeat(seat)) {
        return null;
    }

    return {
        ollama: {
            endpoint: DEFAULT_OLLAMA_ENDPOINT,
            timeoutMs: DEFAULT_OLLAMA_TIMEOUT_MS,
            model: seat.model
        },
        maxTurns: 12,
        maxConsecutiveBotActions: 48
    };
}

export async function runBotOrchestratorForSnapshot(params: {
    snapshot: TurnOrchestratorSnapshot;
    dispatchIntentToMoves: (intent: LegalIntent, playerID: string) => Promise<void> | void;
    getLatestSnapshot: () => TurnOrchestratorSnapshot;
}): Promise<void> {
    const currentPlayer = params.snapshot.ctx && typeof params.snapshot.ctx === 'object'
        ? (params.snapshot.ctx as { currentPlayer?: unknown }).currentPlayer
        : null;

    if (typeof currentPlayer !== 'string') {
        return;
    }

    const orchestratorConfig = resolveBotConfig(params.snapshot, currentPlayer);
    if (!orchestratorConfig) {
        return;
    }

    await runTurnOrchestrator({
        G: params.snapshot.G,
        ctx: params.snapshot.ctx,
        playerID: currentPlayer,
        config: orchestratorConfig,
        isBotPlayer: (playerID) => isBotPlayer(params.getLatestSnapshot(), playerID),
        dispatchIntent: async (intent, dispatchCtx) => {
            await params.dispatchIntentToMoves(intent, dispatchCtx.playerID);
            return params.getLatestSnapshot();
        },
        getLatestSnapshot: params.getLatestSnapshot
    });
}

export function dispatchIntentToMoves(moves: Record<string, (...args: any[]) => unknown>, intent: LegalIntent): void {
    const moveFn = moves[intent.moveType];
    if (typeof moveFn !== 'function') {
        throw new Error(`bot-dispatch-failed:missingMove:${intent.moveType}`);
    }
    const result = intent.payload !== undefined ? moveFn(intent.payload) : moveFn();
    if (result === INVALID_MOVE) {
        throw new Error(`bot-dispatch-failed:invalidMove:${intent.moveType}`);
    }
}
