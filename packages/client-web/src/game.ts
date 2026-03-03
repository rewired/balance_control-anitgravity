import { createBalanceControlGame, createBalanceControlGameWithHooks, type ReplayHookOptions } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';

registerCanonicalPacks();

export const BalanceControlGame = createBalanceControlGame();
export const GAME_NAME = BalanceControlGame.name!;

export function createClientGameWithReplayHooks(replayHook?: ReplayHookOptions) {
    return createBalanceControlGameWithHooks(replayHook);
}
