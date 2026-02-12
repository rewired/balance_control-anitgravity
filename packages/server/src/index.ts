import { Server, Origins } from 'boardgame.io/server';
import { BalanceControl, ExpansionRegistry } from '@balance-control/game';
import { Expansion01 } from '@balance-control/expansion-01';
import { Expansion02 } from '@balance-control/expansion-02';
import { Expansion03 } from '@balance-control/expansion-03';

// Register Expansions
ExpansionRegistry.register(Expansion01);
ExpansionRegistry.register(Expansion02);
ExpansionRegistry.register(Expansion03);

const server = Server({
    games: [BalanceControl],
    origins: [Origins.LOCALHOST],
});

server.run(8000);
