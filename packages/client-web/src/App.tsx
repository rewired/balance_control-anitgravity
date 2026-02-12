import { Client } from 'boardgame.io/react';
import { BalanceControl } from '@balance-control/game';
import { Board } from './Board';

const App = Client({
    game: BalanceControl,
    board: Board,
});

export default App;
