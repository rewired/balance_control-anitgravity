import { createBalanceControlGame } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';

registerCanonicalPacks();

export const BalanceControlGame = createBalanceControlGame();
export const GAME_NAME = BalanceControlGame.name!;
