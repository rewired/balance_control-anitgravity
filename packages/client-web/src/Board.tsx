import React from 'react';
import { GameLayout } from './components/GameLayout';

interface BoardProps {
    G: any;
    ctx: any;
    moves: any;
    events?: any;
    playerID: string | null;
    isActive: boolean;
}

export const Board: React.FC<BoardProps> = (props) => {
    return (
        <GameLayout {...props} />
    );
};
