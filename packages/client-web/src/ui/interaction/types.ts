import type { LegalIntent } from '@balance-control/game';
import type { IntentViewModel } from '../useIntentViewModel';

export type InteractionActionMode = 'none' | 'placeInfluence' | 'moveInfluence' | 'formalizeInfluence' | 'convertResources' | 'takeMeasure';

export type InteractionStateId =
    | 'selectingAction'
    | 'selectingParams'
    | 'selectingVariant'
    | 'draftReady'
    | 'pendingChoiceHardGate';

export interface DraftIntentState {
    /** The legal intent being drafted. */
    intent: LegalIntent | null;
    /** A stable, unique key for the intent. */
    key: string | null;
    /** Whether the intent is still legal in the current game state. */
    isLegalNow: boolean;
}

export interface InteractionController {
    /** Current state machine ID. */
    interactionState: InteractionStateId;
    /** Current draft state. */
    draft: DraftIntentState;

    /** The currently selected tile for inspection. */
    selectedTileId: string | null;
    /** The coordinate string of the selected tile. */
    selectedCoord: string | null;
    /** An intent that is currently being reviewed for confirmation. */
    proposedIntent: LegalIntent | null;
    /** The intent view model for the current state. */
    vm: IntentViewModel;

    /** Current action mode in the ActionDock. */
    actionMode: InteractionActionMode;
    /** Source tile for Move Influence mode. */
    moveInfluenceSourceId: string | null;

    /** Pinned tile for Formalize Influence mode. */
    pinnedCommitteeTileId: string | null;
    /** Pinned tile for Convert Resources mode. */
    pinnedGrassrootsTileId: string | null;
    /** Selected family for Convert Resources mode. */
    selectedConvertFamily: string | null;

    /** Sets the current action mode. */
    setActionMode: (mode: InteractionActionMode) => void;
    /** Selects a tile by ID and coordinate. */
    selectTile: (tileId: string | null, coord: string | null) => void;
    /** Sets the source tile for Move Influence mode. */
    selectMoveInfluenceSource: (tileId: string) => void;
    /** Proposes an intent for confirmation. */
    proposeIntent: (intent: LegalIntent) => void;

    /** Confirms the current draft and dispatches it. */
    confirmDraft: () => void;
    /** Cancels the current draft and resets action session. */
    cancelDraft: () => void;

    /** Dispatches a choice resolution. */
    resolveChoice: (intent: LegalIntent) => void;

    /**
     * Clears current draft, keeps action mode, clears source selection.
     * Returns to selecting source state.
     */
    editDraftSource: () => void;

    /**
     * Clears current draft, keeps action mode and source selection.
     * Returns to selecting destination state.
     */
    editDraftDestination: () => void;

    /**
     * Clears current draft, keeps action mode.
     * Returns to selecting target state.
     */
    editDraftTarget: () => void;

    /**
     * Re-opens variant selection for wizard actions (if applicable).
     * Returns to selecting variant state.
     */
    editDraftVariant: () => void;

    /**
     * Clears pinned committee/grassroots tile.
     * Returns to selecting params state.
     */
    editPinnedTile: () => void;

    /** Sets the selected family for Convert Resources mode. */
    setSelectedConvertFamily: (family: string | null) => void;
}
