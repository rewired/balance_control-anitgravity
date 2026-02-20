import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import { PendingChoiceModal } from './PendingChoiceModal';
import { FormalizeWizardModal } from './FormalizeWizardModal';
import { ConvertWizardModal } from './ConvertWizardModal';
import type { InteractionController } from '../ui/interaction/types';
import { groupFormalizeIntents } from '../ui/interaction/formalizeHelpers';
import { groupConvertIntents } from '../ui/interaction/convertHelpers';

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
        resolveChoice,
        wizard,
        closeWizard,
        proposeIntent
    } = controller;

    const formalizeGroups = useMemo(() => {
        if (wizard?.kind !== 'formalize') return new Map();
        return groupFormalizeIntents(vm.intents);
    }, [wizard?.kind, vm.intents]);

    const convertGroups = useMemo(() => {
        if (wizard?.kind !== 'convert') return new Map();
        return groupConvertIntents(vm.intents);
    }, [wizard?.kind, vm.intents]);

    const activeFormalizeGroups = wizard?.kind === 'formalize'
        ? formalizeGroups.get(wizard.committeeTileId) ?? []
        : [];

    const activeConvertGroup = wizard?.kind === 'convert'
        ? convertGroups.get(wizard.grassrootsTileId) ?? null
        : null;

    return (
        <>
            <PendingChoiceModal
                resolveChoiceIntents={vm.pendingChoice.resolveChoice}
                onResolve={resolveChoice}
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
            <ConvertWizardModal
                open={wizard?.kind === 'convert'}
                G={G}
                grassrootsTileId={wizard?.kind === 'convert' ? wizard.grassrootsTileId : ''}
                tileGroup={activeConvertGroup}
                onSelectIntent={(intent) => {
                    proposeIntent(intent);
                    closeWizard();
                }}
                onClose={closeWizard}
            />
        </>
    );
};
