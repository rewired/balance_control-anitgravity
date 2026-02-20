import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { PendingChoiceModal } from './PendingChoiceModal';
import { MoveConfirmationModal } from './MoveConfirmationModal';
import { FormalizeWizardModal } from './FormalizeWizardModal';
import type { InteractionController } from '../ui/interaction/types';
import { groupFormalizeIntents } from '../ui/interaction/formalizeHelpers';

interface ModalHostProps {
    G: GameState;
    controller: InteractionController;
}

/**
 * Renders blocking modals based on the interaction controller state.
 * @remarks Presentation-only.
 */
export const ModalHost: React.FC<ModalHostProps> = ({ G, controller }) => {
    const {
        vm,
        proposedIntent,
        confirmProposedIntent,
        cancelProposedIntent,
        resolveChoice,
        wizard,
        closeWizard,
        proposeIntent
    } = controller;

    const formalizeGroups = useMemo(() => {
        if (wizard?.kind !== 'formalize') return new Map();
        return groupFormalizeIntents(vm.intents);
    }, [wizard?.kind, vm.intents]);

    const activeFormalizeGroups = wizard?.kind === 'formalize'
        ? formalizeGroups.get(wizard.committeeTileId) ?? []
        : [];

    return (
        <>
            <PendingChoiceModal
                resolveChoiceIntents={vm.pendingChoice.resolveChoice}
                onResolve={resolveChoice}
            />
            <MoveConfirmationModal
                intent={proposedIntent}
                onConfirm={confirmProposedIntent}
                onCancel={cancelProposedIntent}
            />
            <FormalizeWizardModal
                open={wizard?.kind === 'formalize'}
                G={G}
                committeeTileId={wizard?.kind === 'formalize' ? wizard.committeeTileId : ''}
                groups={activeFormalizeGroups}
                onSelectIntent={(intent) => {
                    proposeIntent(intent);
                    closeWizard();
                }}
                onClose={closeWizard}
            />
        </>
    );
};
