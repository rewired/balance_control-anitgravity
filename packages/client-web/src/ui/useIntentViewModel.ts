import { useMemo } from 'react';
import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import { stableSortCoords } from './hexLayout';
import { canonicalJsonStringify } from './interaction/utils';

export type IntentStage = string | null;

export type IntentViewModelInput = {
    G: any;
    ctx: any;
    playerID: string | null;
    selectedTileId: string | null;
    stagedTileId: string | null;
};

export type IntentViewModel = {
    stage: IntentStage;
    intents: LegalIntent[];
    hasPendingChoice: boolean;
    selectedTileId: string | null;
    stagedTileId: string | null;
    pendingChoice: {
        kind: string | null;
        resolveChoice: LegalIntent[];
    };
    drawAndPlace: {
        placeTile: LegalIntent[];
        passTilePlacement: LegalIntent | null;
    };
    political: {
        others: LegalIntent[];
        formalizeInfluence: LegalIntent[];
        convertResources: LegalIntent[];
        measures: LegalIntent[];
    };
    ghostCoords: string[];
};

type BuildIntentViewModelInput = {
    ctx: any;
    playerID: string;
    intents: LegalIntent[];
    selectedTileId: string | null;
    stagedTileId: string | null;
    pendingChoiceKind: string | null;
};

function inferStageBestEffort(ctx: any, playerID: string): IntentStage {
    const activePlayers = ctx?.activePlayers ?? {};
    return activePlayers[playerID] ?? null;
}

/**
 * @remarks
 * Presentation-only: expose pendingChoice.kind only to the owning seat.
 * This prevents non-owner pendingChoice state from hard-gating board interactions (GR-006).
 */
export function getPendingChoiceKindForPlayer(pendingChoice: any, playerID: string): string | null {
    if (!pendingChoice) return null;
    if (pendingChoice.player !== playerID) return null;
    return pendingChoice.kind ?? null;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export function buildIntentViewModel(input: BuildIntentViewModelInput): Omit<IntentViewModel, 'intents'> {
    const stage = inferStageBestEffort(input.ctx, input.playerID);

    const resolveChoice = input.intents
        .filter((intent) => intent.moveType === 'resolveChoice')
        .slice()
        .sort((a, b) => canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {})));
    const hasPendingChoice = resolveChoice.length > 0;

    const placeTile = input.intents.filter((intent) => intent.moveType === 'placeTile');
    const passTilePlacement = input.intents.find((intent) => intent.moveType === 'passTilePlacement') ?? null;
    const formalizeInfluence = input.intents.filter((intent) => intent.moveType === 'formalizeInfluence');
    const convertResources = input.intents.filter((intent) => intent.moveType === 'convertResources');
    const measures = input.intents.filter((intent) => intent.moveType.endsWith('.takeMeasure'));

    const baseOthers = input.intents.filter((intent) => {
        if (intent.moveType === 'resolveChoice') return false;
        if (intent.moveType === 'placeTile') return false;
        if (intent.moveType === 'placeInfluence') return false;
        if (intent.moveType === 'moveInfluence') return false;
        if (intent.moveType === 'passTilePlacement') return false;
        if (intent.moveType === 'formalizeInfluence') return false;
        if (intent.moveType === 'convertResources') return false;
        if (intent.moveType.endsWith('.takeMeasure')) return false;
        return true;
    }).sort((a, b) => {
        if (a.moveType !== b.moveType) {
            return a.moveType.localeCompare(b.moveType);
        }
        return canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {}));
    });

    const ghostCoords = stableSortCoords(
        Array.from(
            new Set(
                placeTile
                    .map((intent) => intent.payload?.targetCoord)
                    .filter((coord): coord is string => typeof coord === 'string' && coord.length > 0)
            )
        )
    );

    return {
        stage,
        hasPendingChoice,
        selectedTileId: input.selectedTileId,
        stagedTileId: input.stagedTileId,
        pendingChoice: {
            kind: input.pendingChoiceKind,
            resolveChoice
        },
        drawAndPlace: { placeTile, passTilePlacement },
        political: {
            others: baseOthers,
            formalizeInfluence,
            convertResources,
            measures
        },
        ghostCoords
    };
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export function useIntentViewModel({ G, ctx, playerID, selectedTileId, stagedTileId }: IntentViewModelInput): IntentViewModel {
    const pid = playerID ?? ctx?.currentPlayer ?? '0';
    const intents = useMemo(() => enumerateLegalIntents(G, ctx, pid), [G, ctx, pid]);

    const vmWithoutIntents = useMemo(() => {
        const pendingChoice = G?.engine?.pendingChoice;
        const pendingChoiceKind = getPendingChoiceKindForPlayer(pendingChoice, pid);
        return buildIntentViewModel({
            ctx,
            playerID: pid,
            intents,
            selectedTileId,
            stagedTileId,
            pendingChoiceKind
        });
    }, [ctx, intents, pid, selectedTileId, stagedTileId, G?.engine?.pendingChoice?.kind, G?.engine?.pendingChoice?.player]);

    return useMemo(() => {
        return {
            ...vmWithoutIntents,
            intents
        };
    }, [intents, vmWithoutIntents]);
}
