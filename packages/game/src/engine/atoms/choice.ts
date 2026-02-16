import type { AtomRegistration } from '../engine-module-registry';
import { allocId } from '../resolver/ids';

function handleChoiceRequest(G: any, atom: any): void {
    const choiceId = allocId(G, 'choice');
    G.engine.pendingChoice = {
        ...atom.choice,
        choiceId,
        resumeToken: choiceId
    };
}

function handleChoiceApply(G: any, _ctx: any, atom: any): void {
    const { selection, context } = atom;
    if (context?.followUp) {
        const followUpAtoms = context.followUp[selection];
        if (followUpAtoms) {
            // Add follow-up atoms to the FRONT of the queue to prioritize them
            G.engine.effectQueue.unshift(...followUpAtoms);
        }
    }
}

export const coreChoiceAtoms: AtomRegistration[] = [
    { kind: 'choice.request', handler: (G, _ctx, atom) => handleChoiceRequest(G as any, atom) },
    { kind: 'choice.apply', handler: (G, ctx, atom) => handleChoiceApply(G as any, ctx, atom) }
];

