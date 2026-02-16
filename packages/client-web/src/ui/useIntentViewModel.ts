import { useMemo } from 'react';
import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import { stableSortCoords } from './hexLayout';

export type IntentStage = string | null;

type JsonLike =
    | null
    | boolean
    | number
    | string
    | JsonLike[]
    | { [key: string]: JsonLike | undefined };

function canonicalize(value: JsonLike): JsonLike {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => canonicalize(entry as JsonLike));
    }

    const input = value as { [key: string]: JsonLike | undefined };
    const ordered: { [key: string]: JsonLike } = {};
    const keys = Object.keys(input).sort();

    for (const key of keys) {
        const entry = input[key];
        if (entry !== undefined) {
            ordered[key] = canonicalize(entry);
        }
    }

    return ordered;
}

function canonicalJsonStringify(value: JsonLike): string {
    return JSON.stringify(canonicalize(value));
}

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
        placeInfluenceForSelected: LegalIntent | null;
        others: LegalIntent[];
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

export function buildIntentViewModel(input: BuildIntentViewModelInput): Omit<IntentViewModel, 'intents'> {
    const stage = inferStageBestEffort(input.ctx, input.playerID);

    const resolveChoice = input.intents
        .filter((intent) => intent.moveType === 'resolveChoice')
        .slice()
        .sort((a, b) => canonicalJsonStringify(a.payload ?? {}).localeCompare(canonicalJsonStringify(b.payload ?? {})));
    const hasPendingChoice = resolveChoice.length > 0;

    const placeTile = input.intents.filter((intent) => intent.moveType === 'placeTile');
    const passTilePlacement = input.intents.find((intent) => intent.moveType === 'passTilePlacement') ?? null;

    const placeInfluenceForSelected = input.selectedTileId
        ? (input.intents.find(
            (intent) => intent.moveType === 'placeInfluence' && intent.payload?.targetTileId === input.selectedTileId
        ) ?? null)
        : null;

    const baseOthers = input.intents.filter((intent) => {
        if (intent.moveType === 'resolveChoice') return false;
        if (intent.moveType === 'placeTile') return false;
        if (intent.moveType === 'placeInfluence') return false;
        if (intent.moveType === 'pass') return false;
        if (intent.moveType === 'passTilePlacement') return false;
        return true;
    });

    const trailing: LegalIntent[] = [];
    if (stage !== 'drawAndPlace') {
        trailing.push(...input.intents.filter((intent) => intent.moveType === 'passTilePlacement'));
    }
    trailing.push(...input.intents.filter((intent) => intent.moveType === 'pass'));

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
        political: { placeInfluenceForSelected, others: [...baseOthers, ...trailing] },
        ghostCoords
    };
}

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
