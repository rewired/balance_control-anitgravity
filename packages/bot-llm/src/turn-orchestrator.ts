import type { LegalIntent } from '@balance-control/game';
import type { GameState } from '@balance-control/rules';
import { selectIntentWithOllama, type BotSelectionResult } from './adapter';
import type { OllamaRequestConfig } from './ollama-client';

export interface TurnOrchestratorConfig {
    ollama: OllamaRequestConfig;
    maxTurns?: number;
    maxConsecutiveBotActions?: number;
}

export interface TurnOrchestratorSnapshot {
    G: GameState;
    ctx: unknown;
}

export interface TurnOrchestratorDispatchContext {
    playerID: string;
    selection: BotSelectionResult;
}

export interface TurnOrchestratorParams {
    G: GameState;
    ctx: unknown;
    playerID: string;
    config: TurnOrchestratorConfig;
    dispatchIntent: (intent: LegalIntent, dispatchContext: TurnOrchestratorDispatchContext) => Promise<TurnOrchestratorSnapshot | void> | TurnOrchestratorSnapshot | void;
    getLatestSnapshot?: () => Promise<TurnOrchestratorSnapshot> | TurnOrchestratorSnapshot;
    isBotPlayer?: (playerID: string) => boolean;
}

export interface TurnOrchestratorReport {
    actionsDispatched: number;
    turnsCompleted: number;
    stoppedReason:
        | 'ok'
        | 'no-legal-moves'
        | 'max-turns-reached'
        | 'max-consecutive-bot-actions-reached'
        | 'active-player-not-bot'
        | 'missing-current-player';
    lastSelection: BotSelectionResult | null;
}

/**
 * Runs the full deterministic bot turn cycle by selecting legal intents through the LLM adapter and dispatching them through a host-provided callback.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects performs network I/O and dispatches engine intents through host callbacks
 */
export async function runTurnOrchestrator(params: TurnOrchestratorParams): Promise<TurnOrchestratorReport> {
    const maxTurns = params.config.maxTurns ?? 1;
    const maxConsecutiveBotActions = params.config.maxConsecutiveBotActions ?? 32;
    const isBotPlayer = params.isBotPlayer ?? ((candidate) => candidate === params.playerID);

    let snapshot: TurnOrchestratorSnapshot = { G: params.G, ctx: params.ctx };
    let actionsDispatched = 0;
    let turnsCompleted = 0;
    let lastSelection: BotSelectionResult | null = null;
    let previousActivePlayer = resolveCurrentPlayer(snapshot.ctx);

    while (true) {
        if (actionsDispatched >= maxConsecutiveBotActions) {
            return {
                actionsDispatched,
                turnsCompleted,
                stoppedReason: 'max-consecutive-bot-actions-reached',
                lastSelection
            };
        }

        const activePlayer = resolveCurrentPlayer(snapshot.ctx);
        if (!activePlayer) {
            return {
                actionsDispatched,
                turnsCompleted,
                stoppedReason: 'missing-current-player',
                lastSelection
            };
        }

        if (!isBotPlayer(activePlayer)) {
            return {
                actionsDispatched,
                turnsCompleted,
                stoppedReason: 'active-player-not-bot',
                lastSelection
            };
        }

        if (turnsCompleted >= maxTurns) {
            return {
                actionsDispatched,
                turnsCompleted,
                stoppedReason: 'max-turns-reached',
                lastSelection
            };
        }

        const selection = await selectIntentWithOllama({
            G: snapshot.G,
            ctx: snapshot.ctx,
            playerID: activePlayer,
            config: params.config.ollama
        });

        lastSelection = selection;
        if (!selection.selectedIntent) {
            return {
                actionsDispatched,
                turnsCompleted,
                stoppedReason: 'no-legal-moves',
                lastSelection
            };
        }

        const maybeSnapshot = await params.dispatchIntent(selection.selectedIntent, {
            playerID: activePlayer,
            selection
        });

        actionsDispatched += 1;
        snapshot = maybeSnapshot ?? (await getLatestSnapshot(params, snapshot));

        const nextActivePlayer = resolveCurrentPlayer(snapshot.ctx);
        if (nextActivePlayer && previousActivePlayer && nextActivePlayer !== previousActivePlayer) {
            turnsCompleted += 1;
            previousActivePlayer = nextActivePlayer;
        }
    }
}

async function getLatestSnapshot(params: TurnOrchestratorParams, fallback: TurnOrchestratorSnapshot): Promise<TurnOrchestratorSnapshot> {
    if (!params.getLatestSnapshot) {
        return fallback;
    }
    return await params.getLatestSnapshot();
}

function resolveCurrentPlayer(ctx: unknown): string | null {
    const currentPlayer = (ctx as { currentPlayer?: unknown } | null)?.currentPlayer;
    return typeof currentPlayer === 'string' && currentPlayer.length > 0 ? currentPlayer : null;
}
