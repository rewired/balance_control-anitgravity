import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { useIntentViewModel } from '../useIntentViewModel';
import { dispatchIntent } from './dispatchIntent';
import type { InteractionController, InteractionActionMode, InteractionStateId, DraftIntentState, UiNotice, DispatchTripwireInfo } from './types';
import { canonicalJsonStringify } from './utils';
import { computeUiStateKey } from './diagnostics';

export interface InteractionControllerProps {
    G: GameState;
    ctx: any;
    playerID: string | null;
    moves: any;
    getDispatchStateKey?: (() => string | null) | undefined;
    onTripwireMismatch?: ((info: DispatchTripwireInfo) => void) | undefined;
}

/**
 * Central hook for managing UI interaction state and dispatching intents.
 * @remarks Presentation-only.
 */
export function useGameInteractionController({
    G,
    ctx,
    playerID,
    moves,
    getDispatchStateKey,
    onTripwireMismatch
}: InteractionControllerProps): InteractionController {
    const myPid = playerID ?? ctx.currentPlayer ?? '0';

    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
    const [proposedIntent, setProposedIntent] = useState<LegalIntent | null>(null);
    const [actionMode, setActionMode] = useState<InteractionActionMode>('none');
    const [moveInfluenceSourceId, setMoveInfluenceSourceId] = useState<string | null>(null);
    const [pinnedCommitteeTileId, setPinnedCommitteeTileId] = useState<string | null>(null);
    const [pinnedGrassrootsTileId, setPinnedGrassrootsTileId] = useState<string | null>(null);
    const [selectedConvertFamily, setSelectedConvertFamily] = useState<string | null>(null);

    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;

    const vm = useIntentViewModel({ G, ctx, playerID: myPid, selectedTileId, stagedTileId });

    const renderStateKey = useMemo(() => computeUiStateKey(G, ctx), [G, ctx]);

    const [uiNotices, setUiNotices] = useState<UiNotice[]>([]);
    const nextNoticeIdRef = useRef(1);
    const noticeTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        return () => {
            for (const timeout of noticeTimeoutsRef.current.values()) {
                clearTimeout(timeout);
            }
            noticeTimeoutsRef.current.clear();
        };
    }, []);

    const pushNotice = useCallback((notice: Omit<UiNotice, 'id'>) => {
        const id = `n${nextNoticeIdRef.current++}`;
        setUiNotices((prev) => [...prev, { ...notice, id }].slice(-3));

        const timeout = setTimeout(() => {
            setUiNotices((prev) => prev.filter((n) => n.id !== id));
            noticeTimeoutsRef.current.delete(id);
        }, 4500);

        noticeTimeoutsRef.current.set(id, timeout);
    }, []);

    // ARCH-06: PendingChoice Hard-Gate
    // When a pending choice exists, the controller enters a restrictive mode.
    // We derive this from the ViewModel to ensure UI consistency.
    const isHardGate = vm.hasPendingChoice;

    // Effect: Clear all transient action state immediately upon entering hard-gate.
    useEffect(() => {
        if (isHardGate) {
            setProposedIntent(null);
            setActionMode('none');
            setMoveInfluenceSourceId(null);
            setPinnedCommitteeTileId(null);
            setPinnedGrassrootsTileId(null);
            setSelectedConvertFamily(null);
            setSelectedTileId(null);
            setSelectedCoord(null);
        }
    }, [isHardGate]);

    const editDraftSource = useCallback(() => {
        setProposedIntent(null);
        setMoveInfluenceSourceId(null);
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, []);

    const editDraftDestination = useCallback(() => {
        setProposedIntent(null);
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, []);

    const editDraftTarget = useCallback(() => {
        setProposedIntent(null);
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, []);

    const editDraftVariant = useCallback(() => {
        setProposedIntent(null);
        setSelectedConvertFamily(null);
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, []);

    const editPinnedTile = useCallback(() => {
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
        // Returns to selectingParams state, but clears selection
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, []);

    const proposeIntent = useCallback((intent: LegalIntent) => {
        // Hard-gate: no new proposals when pending choice exists
        if (isHardGate) {
            return;
        }

        // If we already have a draft, ignore new proposals (must edit first)
        // This enforces "dock-only edit" once draft is ready
        if (proposedIntent) {
            return;
        }
        setProposedIntent(intent);
    }, [proposedIntent, isHardGate]);

    const selectTile = useCallback((tileId: string | null, coord: string | null) => {
        // Hard-gate: no tile selection (inspection disabled) when pending choice exists
        if (isHardGate) {
            return;
        }

        setSelectedTileId(tileId);
        setSelectedCoord(coord);

        // If draft is ready, we are in inspect-only mode.
        // Do not trigger any side effects like setting source or opening wizard.
        if (proposedIntent) {
            return;
        }

        // If pinned tile exists (selectingVariant), we are in inspect-only mode for the parameter.
        // Board clicks should not overwrite the pinned tile.
        if (pinnedCommitteeTileId || pinnedGrassrootsTileId) {
            return;
        }

        if (actionMode === 'formalizeInfluence' && tileId) {
            const hasIntents = vm.intents.some(i =>
                i.moveType === 'formalizeInfluence' &&
                i.payload?.committeeTileId === tileId
            );
            if (hasIntents) {
                setPinnedCommitteeTileId(tileId);
            }
        }

        if (actionMode === 'convertResources' && tileId) {
            const hasIntents = vm.intents.some(i =>
                i.moveType === 'convertResources' &&
                i.payload?.grassrootsTileId === tileId
            );
            if (hasIntents) {
                setPinnedGrassrootsTileId(tileId);
            }
        }
    }, [actionMode, vm.intents, proposedIntent, isHardGate, pinnedCommitteeTileId, pinnedGrassrootsTileId]);

    const confirmDraft = useCallback(() => {
        // Hard-gate: no confirmation allowed if pending choice exists
        if (isHardGate) {
            return;
        }

        if (proposedIntent) {
            const result = dispatchIntent(moves, proposedIntent, {
                renderStateKey,
                getDispatchStateKey,
                onTripwireMismatch
            });

            if (result.ok) {
                setProposedIntent(null);
                setSelectedTileId(null);
                setSelectedCoord(null);
                setActionMode('none');
                setMoveInfluenceSourceId(null);
                setPinnedCommitteeTileId(null);
                setPinnedGrassrootsTileId(null);
                setSelectedConvertFamily(null);
            } else {
                pushNotice({
                    kind: 'dispatch.rejected',
                    moveType: proposedIntent.moveType,
                    seat: myPid,
                    currentPlayer: ctx?.currentPlayer ?? null,
                    reason: result.reason ?? 'unknown'
                });
            }
        }
    }, [isHardGate, proposedIntent, moves, renderStateKey, getDispatchStateKey, onTripwireMismatch, pushNotice, myPid, ctx?.currentPlayer]);

    const cancelDraft = useCallback(() => {
        setProposedIntent(null);
        setActionMode('none');
        setMoveInfluenceSourceId(null);
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
        // Preserves inspector selection (selectedTileId/selectedCoord) per contract
    }, []);

    const resolveChoice = useCallback((intent: LegalIntent) => {
        if (intent.moveType !== 'resolveChoice') {
            console.error(`[resolveChoice] Attempted to dispatch non-choice intent: ${intent.moveType}`);
            return;
        }
        const result = dispatchIntent(moves, intent, {
            renderStateKey,
            getDispatchStateKey,
            onTripwireMismatch
        });
        if (!result.ok) {
            pushNotice({
                kind: 'dispatch.rejected',
                moveType: intent.moveType,
                seat: myPid,
                currentPlayer: ctx?.currentPlayer ?? null,
                reason: result.reason ?? 'unknown'
            });
        }
    }, [moves, renderStateKey, getDispatchStateKey, onTripwireMismatch, pushNotice, myPid, ctx?.currentPlayer]);

    // Reset action mode when phase changes
    const stage = vm.stage;
    useEffect(() => {
        setActionMode('none');
        setMoveInfluenceSourceId(null);
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
    }, [stage]);

    // Reset interaction state when active player seat changes (Hotseat)
    useEffect(() => {
        setProposedIntent(null);
        setActionMode('none');
        setMoveInfluenceSourceId(null);
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
        setSelectedTileId(null);
        setSelectedCoord(null);
    }, [myPid]);

    // Handle Escape key to clear selection/proposal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedTileId(null);
                setSelectedCoord(null);
                setProposedIntent(null);
                setActionMode('none');
                setMoveInfluenceSourceId(null);
                setPinnedCommitteeTileId(null);
                setPinnedGrassrootsTileId(null);
                setSelectedConvertFamily(null);
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
        // Hard-gate: no mode switching allowed if pending choice exists
        if (isHardGate) {
            return;
        }

        setActionMode(mode);
        setMoveInfluenceSourceId(null);
        setPinnedCommitteeTileId(null);
        setPinnedGrassrootsTileId(null);
        setSelectedConvertFamily(null);
        if (mode !== 'none') {
            setSelectedTileId(null);
            setSelectedCoord(null);
        }
    }, [isHardGate]);

    const selectMoveInfluenceSource = useCallback((tileId: string) => {
        setMoveInfluenceSourceId(tileId);
    }, []);

    let interactionState: InteractionStateId = 'selectingAction';
    if (isHardGate) {
        interactionState = 'pendingChoiceHardGate';
    } else if (proposedIntent) {
        interactionState = 'draftReady';
    } else if (pinnedCommitteeTileId || pinnedGrassrootsTileId) {
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
        pinnedCommitteeTileId,
        pinnedGrassrootsTileId,
        selectedConvertFamily,
        setActionMode: setActionModeWithSideEffects,
        selectTile,
        selectMoveInfluenceSource,
        proposeIntent,
        confirmDraft,
        cancelDraft,
        editDraftSource,
        editDraftDestination,
        editDraftTarget,
        editDraftVariant,
        editPinnedTile,
        setSelectedConvertFamily,
        resolveChoice,
        uiNotices
    };
}
