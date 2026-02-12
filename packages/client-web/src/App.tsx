import { Client } from 'boardgame.io/react';
import * as GameModule from '@balance-control/game';
import { Board } from './Board';

const BalanceControl = (GameModule as any).BalanceControl;

const App = Client({
    game: BalanceControl,
    board: Board,
});

export default App;
