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
};

function inferStageBestEffort(ctx: any, playerID: string): IntentStage {
    const activePlayers = ctx?.activePlayers ?? {};
    return activePlayers[playerID] ?? null;
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
        pendingChoice: { resolveChoice },
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
        return buildIntentViewModel({
            ctx,
            playerID: pid,
            intents,
            selectedTileId,
            stagedTileId
        });
    }, [ctx, intents, pid, selectedTileId, stagedTileId]);

    return useMemo(() => {
        return {
            ...vmWithoutIntents,
            intents
        };
    }, [intents, vmWithoutIntents]);
}
