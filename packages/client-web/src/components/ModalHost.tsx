import React from 'react';
import { PendingChoiceModal } from './PendingChoiceModal';
import { MoveConfirmationModal } from './MoveConfirmationModal';
import type { InteractionController } from '../ui/interaction/types';

interface ModalHostProps {
    controller: InteractionController;
}

/**
 * Renders blocking modals based on the interaction controller state.
 * @remarks Presentation-only.
 */
export const ModalHost: React.FC<ModalHostProps> = ({ controller }) => {
    const { vm, proposedIntent, confirmProposedIntent, cancelProposedIntent, resolveChoice } = controller;

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
        </>
    );
};
