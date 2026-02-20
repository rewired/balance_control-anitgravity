import React from 'react';
import type { GameState } from '@balance-control/rules';
import { PendingChoiceModal } from './PendingChoiceModal';
import type { InteractionController } from '../ui/interaction/types';

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
        resolveChoice
    } = controller;

    return (
        <>
            {vm.pendingChoice.kind !== 'selectTile' && (
                <PendingChoiceModal
                    resolveChoiceIntents={vm.pendingChoice.resolveChoice}
                    onResolve={resolveChoice}
                />
            )}
        </>
    );
};
