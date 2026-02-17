import { Server, Origins } from 'boardgame.io/server';
import { createServerGame } from './boot';

const BalanceControl = createServerGame();
const server = Server({
    games: [BalanceControl],
    origins: [Origins.LOCALHOST],
});

server.run(8000);
