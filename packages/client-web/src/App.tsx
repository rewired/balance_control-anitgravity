import { Client } from 'boardgame.io/react';
import type { ComponentType } from 'react';
import { BalanceControl } from '@balance-control/game';
import { Board } from './Board';

const App: ComponentType = Client({
    game: BalanceControl,
    board: Board,
});

export default App;
