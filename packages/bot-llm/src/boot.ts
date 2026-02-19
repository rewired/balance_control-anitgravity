import { createBalanceControlGame } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';

export function registerBotPacks(): void {
    registerCanonicalPacks();
}

export function createBotGame(): ReturnType<typeof createBalanceControlGame> {
    registerBotPacks();
    return createBalanceControlGame();
}
