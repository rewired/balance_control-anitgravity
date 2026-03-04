export type ReplayDomainFieldType =
    | 'tileId'
    | 'resourceType'
    | 'resourceCount'
    | 'resourceId[]';

export type ReplayTypedFields = Readonly<Record<string, ReplayDomainFieldType>>;

type ReplayMoveArgMapper = (arg: unknown, argIndex: number) => ReplayTypedFields;

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function readObject(arg: unknown): Record<string, unknown> | undefined {
    if (!arg || typeof arg !== 'object' || Array.isArray(arg)) {
        return undefined;
    }
    return arg as Record<string, unknown>;
}

function convertResourcesArgTypes(arg: unknown, argIndex: number): ReplayTypedFields {
    const payload = readObject(arg);
    if (!payload) return {};

    const typed: Record<string, ReplayDomainFieldType> = {};
    const prefix = `${argIndex}.`;

    if (typeof payload.grassrootsTileId === 'string') {
        typed[`${prefix}grassrootsTileId`] = 'tileId';
    }

    if (typeof payload.outputResort === 'string') {
        typed[`${prefix}outputResort`] = 'resourceType';
    }

    if (isStringArray(payload.inputResourceIds)) {
        typed[`${prefix}inputResourceIds`] = 'resourceId[]';
    } else if (typeof payload.inputCount === 'number') {
        typed[`${prefix}inputCount`] = 'resourceCount';
    }

    if (isStringArray(payload.extraResourceIds)) {
        typed[`${prefix}extraResourceIds`] = 'resourceId[]';
    }

    return typed;
}

function placeInfluenceArgTypes(arg: unknown, argIndex: number): ReplayTypedFields {
    const payload = readObject(arg);
    if (!payload) return {};

    const typed: Record<string, ReplayDomainFieldType> = {};
    const prefix = `${argIndex}.`;

    if (typeof payload.targetTileId === 'string') {
        typed[`${prefix}targetTileId`] = 'tileId';
    }
    if (isStringArray(payload.extraResourceIds)) {
        typed[`${prefix}extraResourceIds`] = 'resourceId[]';
    }

    return typed;
}

function moveInfluenceArgTypes(arg: unknown, argIndex: number): ReplayTypedFields {
    const payload = readObject(arg);
    if (!payload) return {};

    const typed: Record<string, ReplayDomainFieldType> = {};
    const prefix = `${argIndex}.`;

    if (typeof payload.extraResourceIds === 'object' && isStringArray(payload.extraResourceIds)) {
        typed[`${prefix}extraResourceIds`] = 'resourceId[]';
    }

    return typed;
}

function formalizeInfluenceArgTypes(arg: unknown, argIndex: number): ReplayTypedFields {
    const payload = readObject(arg);
    if (!payload) return {};

    const typed: Record<string, ReplayDomainFieldType> = {};
    const prefix = `${argIndex}.`;

    if (typeof payload.committeeTileId === 'string') {
        typed[`${prefix}committeeTileId`] = 'tileId';
    }
    if (isStringArray(payload.paymentResourceIds)) {
        typed[`${prefix}paymentResourceIds`] = 'resourceId[]';
    }
    if (isStringArray(payload.extraResourceIds)) {
        typed[`${prefix}extraResourceIds`] = 'resourceId[]';
    }

    return typed;
}

const MOVE_ARG_TYPE_MAPPERS: Readonly<Record<string, ReplayMoveArgMapper>> = {
    convertResources: convertResourcesArgTypes,
    formalizeInfluence: formalizeInfluenceArgTypes,
    moveInfluence: moveInfluenceArgTypes,
    placeInfluence: placeInfluenceArgTypes,
};

/**
 * Derives optional domain type metadata for replay action args.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function deriveReplayTypedFields(moveType: string, args: readonly unknown[]): ReplayTypedFields | undefined {
    const mapper = MOVE_ARG_TYPE_MAPPERS[moveType];
    if (!mapper || args.length === 0) return undefined;

    const typedEntries: [string, ReplayDomainFieldType][] = [];

    args.forEach((arg, argIndex) => {
        const mapped = mapper(arg, argIndex);
        const keys = Object.keys(mapped).sort((a, b) => a.localeCompare(b));
        for (const key of keys) {
            typedEntries.push([key, mapped[key]]);
        }
    });

    if (typedEntries.length === 0) {
        return undefined;
    }

    return Object.fromEntries(typedEntries);
}
