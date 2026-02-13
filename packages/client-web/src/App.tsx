import { Client } from 'boardgame.io/react';
import type { ComponentType } from 'react';
import * as GameModule from '@balance-control/game';
import { Board } from './Board';

const BalanceControl = (GameModule as any).BalanceControl;

const App: ComponentType = Client({
    game: BalanceControl,
    board: Board,
});

export default App;
