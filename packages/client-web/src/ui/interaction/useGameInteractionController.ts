import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { useIntentViewModel } from '../useIntentViewModel';
import { dispatchIntent } from './dispatchIntent';
import type { InteractionController, InteractionActionMode, InteractionStateId, DraftIntentState } from './types';
import { canonicalJsonStringify } from './utils';

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
    const [actionMode, setActionMode] = useState<InteractionActionMode>('none');
    const [moveInfluenceSourceId, setMoveInfluenceSourceId] = useState<string | null>(null);
    const [wizard, setWizard] = useState<InteractionController['wizard']>(null);

    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;

    const vm = useIntentViewModel({ G, ctx, playerID: myPid, selectedTileId, stagedTileId });

    const editDraftParams = useCallback(() => {
        setProposedIntent(null);
    }, []);

    const editDraftVariant = useCallback(() => {
        setProposedIntent(null);
    }, []);

    const proposeIntent = useCallback((intent: LegalIntent) => {
        // If we already have a draft, ignore new proposals (must edit first)
        // This enforces "dock-only edit" once draft is ready
        if (proposedIntent) {
            return;
        }
        setProposedIntent(intent);
    }, [proposedIntent]);

    const selectTile = useCallback((tileId: string | null, coord: string | null) => {
        setSelectedTileId(tileId);
        setSelectedCoord(coord);

        // If draft is ready, we are in inspect-only mode.
        // Do not trigger any side effects like setting source or opening wizard.
        if (proposedIntent) {
            return;
        }

        if (actionMode === 'formalizeInfluence' && tileId) {
            const hasIntents = vm.intents.some(i =>
                i.moveType === 'formalizeInfluence' &&
                i.payload?.committeeTileId === tileId
            );
            if (hasIntents) {
                setWizard({ kind: 'formalize', committeeTileId: tileId });
            }
        }

        if (actionMode === 'convertResources' && tileId) {
            const hasIntents = vm.intents.some(i =>
                i.moveType === 'convertResources' &&
                i.payload?.grassrootsTileId === tileId
            );
            if (hasIntents) {
                setWizard({ kind: 'convert', grassrootsTileId: tileId });
            }
        }
    }, [actionMode, moveInfluenceSourceId, vm.intents, proposedIntent]);

    const confirmDraft = useCallback(() => {
        if (proposedIntent) {
            dispatchIntent(moves, proposedIntent);
            setProposedIntent(null);
            setSelectedTileId(null);
            setSelectedCoord(null);
            setActionMode('none');
            setMoveInfluenceSourceId(null);
        }
    }, [proposedIntent, moves]);

    const cancelDraft = useCallback(() => {
        setProposedIntent(null);
    }, []);

    const resolveChoice = useCallback((intent: LegalIntent) => {
        if (intent.moveType !== 'resolveChoice') {
            console.error(`[resolveChoice] Attempted to dispatch non-choice intent: ${intent.moveType}`);
            return;
        }
        dispatchIntent(moves, intent);
    }, [moves]);

    const closeWizard = useCallback(() => {
        setWizard(null);
    }, []);

    // Reset action mode when phase changes
    const stage = vm.stage;
    useEffect(() => {
        setActionMode('none');
        setMoveInfluenceSourceId(null);
        setWizard(null);
    }, [stage]);

    // Handle Escape key to clear selection/proposal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedTileId(null);
                setSelectedCoord(null);
                setProposedIntent(null);
                setActionMode('none');
                setMoveInfluenceSourceId(null);
                setWizard(null);
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

    const setActionModeWithSideEffects = useCallback((mode: InteractionActionMode) => {
        setActionMode(mode);
        setMoveInfluenceSourceId(null);
        setWizard(null);
        if (mode !== 'none') {
            setSelectedTileId(null);
            setSelectedCoord(null);
        }
    }, []);

    const selectMoveInfluenceSource = useCallback((tileId: string) => {
        setMoveInfluenceSourceId(tileId);
    }, []);

    const hasPendingChoice = !!G.engine?.pendingChoice;

    let interactionState: InteractionStateId = 'selectingAction';
    if (hasPendingChoice) {
        interactionState = 'pendingChoiceHardGate';
    } else if (proposedIntent) {
        interactionState = 'draftReady';
    } else if (wizard) {
        interactionState = 'selectingVariant';
    } else if (actionMode !== 'none') {
        interactionState = 'selectingParams';
    }

    const draft: DraftIntentState = {
        intent: proposedIntent,
        key: proposedIntent ? canonicalJsonStringify(proposedIntent) : null,
        isLegalNow: proposedIntent ? vm.intents.some(i =>
            i.moveType === proposedIntent.moveType &&
            canonicalJsonStringify(i.payload ?? {}) === canonicalJsonStringify(proposedIntent.payload ?? {})
        ) : false
    };

    return {
        interactionState,
        draft,
        selectedTileId,
        selectedCoord,
        proposedIntent,
        vm,
        actionMode,
        moveInfluenceSourceId,
        wizard,
        setActionMode: setActionModeWithSideEffects,
        selectTile,
        selectMoveInfluenceSource,
        proposeIntent,
        confirmDraft,
        cancelDraft,
        editDraftParams,
        editDraftVariant,
        resolveChoice,
        closeWizard
    };
}
