import type { LegalIntent } from '@balance-control/game';
import type { IntentViewModel } from '../useIntentViewModel';

export type InteractionActionMode = 'none' | 'placeInfluence' | 'moveInfluence' | 'formalizeInfluence';

export interface InteractionController {
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

    /** Current active wizard state. */
    wizard: { kind: 'formalize'; committeeTileId: string } | null;

    /** Sets the current action mode. */
    setActionMode: (mode: InteractionActionMode) => void;
    /** Selects a tile by ID and coordinate. */
    selectTile: (tileId: string | null, coord: string | null) => void;
    /** Proposes an intent for confirmation. */
    proposeIntent: (intent: LegalIntent) => void;
    /** Confirms the currently proposed intent and dispatches it. */
    confirmProposedIntent: () => void;
    /** Cancels the currently proposed intent. */
    cancelProposedIntent: () => void;
    /** Dispatches a choice resolution. */
    resolveChoice: (intent: LegalIntent) => void;
    /** Dispatches an intent immediately without confirmation. */
    dispatchIntent: (intent: LegalIntent) => void;
    /** Closes the current active wizard. */
    closeWizard: () => void;
}
