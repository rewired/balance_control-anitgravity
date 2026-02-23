import React from 'react';
import { GameLayout } from './components/GameLayout';

interface BoardProps {
    G: any;
    ctx: any;
    moves: any;
    events?: any;
    playerID: string | null;
    isActive: boolean;
    getDispatchStateKey?: (() => string | null) | undefined;
    onTripwireMismatch?: ((info: import('./ui/interaction/types').DispatchTripwireInfo) => void) | undefined;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const Board: React.FC<BoardProps> = (props) => {
    return (
        <GameLayout {...props} />
    );
};
