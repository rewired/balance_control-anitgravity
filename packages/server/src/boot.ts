import { createBalanceControlGame } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';

export function registerServerPacks(): void {
    registerCanonicalPacks();
}

export function createServerGame() {
    registerServerPacks();
    return createBalanceControlGame();
}
