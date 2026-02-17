import { createBalanceControlGame, ExpansionRegistry } from '@balance-control/game';
import { Expansion01 } from '@balance-control/expansion-01';
import { Expansion02 } from '@balance-control/expansion-02';
import { Expansion03 } from '@balance-control/expansion-03';

ExpansionRegistry.register(Expansion01);
ExpansionRegistry.register(Expansion02);
ExpansionRegistry.register(Expansion03);

export const BalanceControlGame = createBalanceControlGame();
export const GAME_NAME = BalanceControlGame.name;

