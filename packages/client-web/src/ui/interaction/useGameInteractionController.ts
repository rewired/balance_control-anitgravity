import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { useIntentViewModel } from '../useIntentViewModel';
import { dispatchIntent } from './dispatchIntent';
import type { InteractionController } from './types';

export interface InteractionControllerProps {
    G: GameState;
    ctx: any;
    playerID: string | null;
    moves: any;
}

/**
 * Central hook for managing UI interaction state and dispatching intents.
 * @remarks Presentation-only.
 */
export function useGameInteractionController({
    G,
    ctx,
    playerID,
    moves
}: InteractionControllerProps): InteractionController {
    const myPid = playerID ?? ctx.currentPlayer ?? '0';

    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
    const [proposedIntent, setProposedIntent] = useState<LegalIntent | null>(null);

    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;

    const vm = useIntentViewModel({ G, ctx, playerID: myPid, selectedTileId, stagedTileId });

    const selectTile = useCallback((tileId: string | null, coord: string | null) => {
        setSelectedTileId(tileId);
        setSelectedCoord(coord);
    }, []);

    const proposeIntent = useCallback((intent: LegalIntent) => {
        setProposedIntent(intent);
    }, []);

    const confirmProposedIntent = useCallback(() => {
        if (proposedIntent) {
            dispatchIntent(moves, proposedIntent);
            setProposedIntent(null);
            setSelectedTileId(null);
            setSelectedCoord(null);
        }
    }, [proposedIntent, moves]);

    const cancelProposedIntent = useCallback(() => {
        setProposedIntent(null);
    }, []);

    const resolveChoice = useCallback((intent: LegalIntent) => {
        dispatchIntent(moves, intent);
    }, [moves]);

    const dispatchIntentImmediate = useCallback((intent: LegalIntent) => {
        dispatchIntent(moves, intent);
    }, [moves]);

    // Handle Escape key to clear selection/proposal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedTileId(null);
                setSelectedCoord(null);
                setProposedIntent(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Keep selectedTileId and selectedCoord in sync with G.grid
    useEffect(() => {
        if (selectedCoord) {
            const tileAtCoord = G.grid?.[selectedCoord] ?? null;
            if (!tileAtCoord) {
                if (selectedTileId) {
                    setSelectedTileId(null);
                    setSelectedCoord(null);
                }
                return;
            }
            if (tileAtCoord !== selectedTileId) {
                setSelectedTileId(tileAtCoord);
            }
            return;
        }

        if (selectedTileId) {
            const match = Object.entries(G.grid || {}).find(([, tileId]) => tileId === selectedTileId);
            if (match) {
                setSelectedCoord(match[0]);
            }
        }
    }, [G.grid, selectedCoord, selectedTileId]);

    return {
        selectedTileId,
        selectedCoord,
        proposedIntent,
        vm,
        selectTile,
        proposeIntent,
        confirmProposedIntent,
        cancelProposedIntent,
        resolveChoice,
        dispatchIntent: dispatchIntentImmediate
    };
}
