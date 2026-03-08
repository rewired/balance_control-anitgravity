import { INVALID_MOVE } from 'boardgame.io/core';
import { hashState } from '../hash-state';
import type { MoveMap } from '../move-module-registry';
import { deriveReplayTypedFields, type ReplayTypedFields } from './replay-typed-fields';

export type ReplayResourceSnapshot = Readonly<{
    owner?: string;
    resort?: string;
    zone: string;
}>;

export type ReplayMetaMarkerSnapshot = Readonly<{
    owner?: string;
    measureId?: string;
    playCount?: number;
    targetTileId?: string;
    mode?: string;
    zone: string;
}>;

export type ReplayStateSnapshot = Readonly<{
    zones: Record<string, readonly string[]>;
    resources: Record<string, ReplayResourceSnapshot>;
    metaMarkers: Record<string, ReplayMetaMarkerSnapshot>;
}>;

export type ReplayStateDelta = Readonly<{
    changedZones?: Record<string, readonly string[]>;
    removedZones?: readonly string[];
    changedResources?: Record<string, ReplayResourceSnapshot>;
    removedResources?: readonly string[];
    changedMetaMarkers?: Record<string, ReplayMetaMarkerSnapshot>;
    removedMetaMarkers?: readonly string[];
}>;

/**
 * Canonical replay payload for a player-driven action record.
 *
 * @remarks
 * Infrastructure contract for Replay Format v1 `action` lines. `matchConfig` and
 * `expansions` are optional on body records because they are canonically defined
 * by the replay `header`; when present on an action record they MUST mirror the
 * same deterministic semantics as header metadata (same effective setup config,
 * same canonical expansion list).
 *
 * `matchConfig` carries replay-relevant deterministic setup parameters only.
 * `expansions` carries the canonical enabled expansion IDs in stable order with
 * no duplicates.
 *
 * @deterministic
 * @pure
 * @see docs/replay-format-v1.md#31-header
 * @see docs/replay-format-v1.md#32-action
 */
export type ReplayActionRecord = Readonly<{
    recordType: 'action';
    seq: number;
    player: string;
    moveType: string;
    args: unknown[];
    typedFields?: ReplayTypedFields;
    turn?: number;
    phase?: string;
    stateHash?: string;
    stateDelta?: ReplayStateDelta;
    stateSnapshot?: ReplayStateSnapshot;
    matchId?: string;
    seed?: string;
    matchConfig?: Record<string, unknown>;
    expansions?: readonly string[];
}>;

/**
 * Canonical replay payload for a non-player round-settlement system record.
 *
 * @remarks
 * Infrastructure contract for Replay Format v1 `system.roundSettlement` lines.
 * `matchConfig` and `expansions` are optional replay-context echoes; if present,
 * they MUST be semantically identical to header metadata for the same replay
 * stream (deterministic setup config + canonical expansion set).
 *
 * @deterministic
 * @pure
 * @see docs/replay-format-v1.md#31-header
 * @see docs/replay-format-v1.md#33-systemroundsettlement
 */
export type ReplaySystemRoundSettlementRecord = Readonly<{
    recordType: 'system.roundSettlement';
    roundNumber: number;
    settlementKind: 'regular' | 'final';
    resortTileOrder: readonly string[];
    stateHash?: string;
    matchId?: string;
    seed?: string;
    matchConfig?: Record<string, unknown>;
    expansions?: readonly string[];
}>;

/**
 * Canonical replay payload for a deterministic checkpoint boundary.
 *
 * @remarks
 * Infrastructure contract for Replay Format v1 `checkpoint` lines. Checkpoints
 * may repeat replay header metadata for convenience; when `matchConfig` and/or
 * `expansions` are present, consumers MUST treat them as header-equivalent
 * metadata and reject semantic mismatch.
 *
 * @deterministic
 * @pure
 * @see docs/replay-format-v1.md#31-header
 * @see docs/replay-format-v1.md#34-checkpoint-optional-mvp
 */
export type ReplayCheckpointRecord = Readonly<{
    recordType: 'checkpoint';
    afterSeq: number;
    stateHash?: string;
    stateSnapshot: ReplayStateSnapshot;
    matchId?: string;
    seed?: string;
    matchConfig?: Record<string, unknown>;
    expansions?: readonly string[];
}>;

export type ReplayRecord = ReplayActionRecord | ReplaySystemRoundSettlementRecord | ReplayCheckpointRecord;

/**
 * Sink contract used by game/server replay writers.
 *
 * @remarks
 * Boundary interface between `packages/game` emission and downstream sinks
 * (e.g., server NDJSON persistence). Implementations MUST preserve record
 * ordering and payload values exactly as emitted to maintain replay
 * determinism and header/body metadata consistency.
 *
 * @deterministic
 * @sideEffects Receives emitted replay records and forwards them to an external sink implementation.
 * @see docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 * @see docs/replay-format-v1.md
 */
export interface ReplaySink {
    writeRecord(record: ReplayRecord): void;

    /**
     * Finalizes replay sink lifecycle.
     *
     * @remarks
     * Sinks that emit replay boundary records (e.g. `footer`) MUST flush those
     * terminal records during `close()` before process shutdown. Callers SHOULD
     * invoke this hook exactly once when the owning process is terminating.
     *
     * @deterministic
     */
    close?(): void | Promise<void>;
}

export type ReplaySinkErrorRecord = Readonly<{
    error: unknown;
    record: ReplayRecord;
}>;

export type ReplaySinkErrorChannel = (event: ReplaySinkErrorRecord) => void;

export type ReplayHookOptions = Readonly<{
    sink?: ReplaySink;
    onError?: ReplaySinkErrorChannel;
    includeStateHash?: boolean;
    includeStateDelta?: boolean;
    snapshotEveryActions?: number;
}>;

export type ReplaySystemRoundSettlementPayload = Readonly<{
    roundNumber: number;
    settlementKind: 'regular' | 'final';
    resortTileOrder: readonly string[];
}>;


function resolveReplaySeed(context: any): string | undefined {
    const seedCandidate = context?.G?.engine?.attributes?.seed;
    return typeof seedCandidate === 'string' ? seedCandidate : undefined;
}

function resolveReplayMatchConfig(context: any): Record<string, unknown> | undefined {
    const players = context?.ctx?.numPlayers;
    if (typeof players !== 'number' || !Number.isInteger(players) || players < 2) {
        return undefined;
    }

    const expansionFlags = (context?.G?.meta?.cfg?.expansions ?? {}) as Record<string, unknown>;
    return {
        players,
        expansions: {
            ex01: expansionFlags.ex01 === true,
            ex02: expansionFlags.ex02 === true,
            ex03: expansionFlags.ex03 === true,
        },
    };
}

function resolveReplayExpansions(matchConfig: Record<string, unknown> | undefined): readonly string[] | undefined {
    if (!matchConfig) return undefined;
    const expansionFlags = (matchConfig.expansions ?? {}) as Record<string, unknown>;
    const enabled: string[] = [];
    if (expansionFlags.ex01 === true) enabled.push('exp01');
    if (expansionFlags.ex02 === true) enabled.push('exp02');
    if (expansionFlags.ex03 === true) enabled.push('exp03');
    return enabled;
}

function isDeterministicEngineObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveObjectZones(G: any): Record<string, string> {
    const objectZoneIndex: Record<string, string> = {};
    const zones = isDeterministicEngineObject(G?.zones) ? G.zones : {};

    for (const [zoneId, zone] of Object.entries(zones)) {
        if (!isDeterministicEngineObject(zone) || !Array.isArray(zone.items)) continue;
        for (const itemId of zone.items) {
            if (typeof itemId !== 'string') continue;
            objectZoneIndex[itemId] = zoneId;
        }
    }

    return objectZoneIndex;
}

function orderedEntries<T>(value: Record<string, T>): Array<[string, T]> {
    return Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Projects authoritative engine state into a minimal replay snapshot surface.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function projectReplayStateSnapshot(G: any): ReplayStateSnapshot {
    const zonesInput = isDeterministicEngineObject(G?.zones) ? G.zones : {};
    const objectsInput = isDeterministicEngineObject(G?.objects) ? G.objects : {};
    const objectZones = resolveObjectZones(G);

    const zones: Record<string, readonly string[]> = {};
    for (const [zoneId, zone] of orderedEntries(zonesInput)) {
        if (!isDeterministicEngineObject(zone) || !Array.isArray(zone.items)) continue;
        zones[zoneId] = zone.items.filter((itemId): itemId is string => typeof itemId === 'string');
    }

    const resources: Record<string, ReplayResourceSnapshot> = {};
    const metaMarkers: Record<string, ReplayMetaMarkerSnapshot> = {};

    for (const [objectId, objectValue] of orderedEntries(objectsInput)) {
        if (!isDeterministicEngineObject(objectValue)) continue;
        const zone = objectZones[objectId] ?? '__unzoned__';

        if (objectValue.type === 'Resource') {
            resources[objectId] = {
                owner: typeof objectValue.owner === 'string' ? objectValue.owner : undefined,
                resort: typeof objectValue.resort === 'string' ? objectValue.resort : undefined,
                zone,
            };
            continue;
        }

        if (objectValue.type === 'MetaMarker') {
            metaMarkers[objectId] = {
                owner: typeof objectValue.owner === 'string' ? objectValue.owner : undefined,
                measureId: typeof objectValue.measureId === 'string' ? objectValue.measureId : undefined,
                playCount: typeof objectValue.playCount === 'number' ? objectValue.playCount : undefined,
                targetTileId: typeof objectValue.targetTileId === 'string' ? objectValue.targetTileId : undefined,
                mode: typeof objectValue.mode === 'string' ? objectValue.mode : undefined,
                zone,
            };
        }
    }

    return { zones, resources, metaMarkers };
}

function areStringArraysEqual(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function computeRecordMapDelta<T extends Record<string, unknown>>(
    previous: Record<string, T>,
    next: Record<string, T>
): { changed?: Record<string, T>; removed?: readonly string[] } {
    const changed: Record<string, T> = {};
    const removed: string[] = [];

    for (const [key, nextValue] of orderedEntries(next)) {
        const previousValue = previous[key];
        if (!previousValue || JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
            changed[key] = nextValue;
        }
    }

    for (const key of Object.keys(previous).sort((a, b) => a.localeCompare(b))) {
        if (!(key in next)) {
            removed.push(key);
        }
    }

    return {
        changed: Object.keys(changed).length > 0 ? changed : undefined,
        removed: removed.length > 0 ? removed : undefined,
    };
}

function computeReplayStateDelta(previous: ReplayStateSnapshot | undefined, next: ReplayStateSnapshot): ReplayStateDelta {
    if (!previous) {
        return {
            changedZones: next.zones,
            changedResources: next.resources,
            changedMetaMarkers: next.metaMarkers,
        };
    }

    const changedZones: Record<string, readonly string[]> = {};
    const removedZones: string[] = [];

    for (const [zoneId, zoneItems] of orderedEntries(next.zones)) {
        if (!areStringArraysEqual(previous.zones[zoneId], zoneItems)) {
            changedZones[zoneId] = zoneItems;
        }
    }
    for (const zoneId of Object.keys(previous.zones).sort((a, b) => a.localeCompare(b))) {
        if (!(zoneId in next.zones)) removedZones.push(zoneId);
    }

    const resourceDelta = computeRecordMapDelta(previous.resources, next.resources);
    const markerDelta = computeRecordMapDelta(previous.metaMarkers, next.metaMarkers);

    return {
        changedZones: Object.keys(changedZones).length > 0 ? changedZones : undefined,
        removedZones: removedZones.length > 0 ? removedZones : undefined,
        changedResources: resourceDelta.changed,
        removedResources: resourceDelta.removed,
        changedMetaMarkers: markerDelta.changed,
        removedMetaMarkers: markerDelta.removed,
    };
}

/**
 * Wraps move handlers with a best-effort post-success replay hook.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function withReplaySink(moves: MoveMap, options?: ReplayHookOptions): MoveMap {
    if (!options?.sink) return moves;

    let seq = 1;
    let previousSnapshot: ReplayStateSnapshot | undefined;
    const wrapped: MoveMap = {};

    for (const [moveType, moveFn] of Object.entries(moves)) {
        wrapped[moveType] = ((context: any, ...args: unknown[]) => {
            const isClientOptimistic = Boolean((context?.G as any)?._isPlayerView);
            const result = moveFn(context, ...args);
            if (result === INVALID_MOVE) return result;

            if (isClientOptimistic) {
                return result;
            }

            const playerId = context?.ctx?.currentPlayer;
            if (typeof playerId !== 'string') return result;

            const matchConfig = resolveReplayMatchConfig(context);
            const stateSnapshot = projectReplayStateSnapshot(context?.G);
            const stateDelta = options.includeStateDelta ? computeReplayStateDelta(previousSnapshot, stateSnapshot) : undefined;
            const record: ReplayActionRecord = {
                recordType: 'action',
                seq,
                player: playerId,
                moveType,
                args,
                typedFields: deriveReplayTypedFields(moveType, args),
                turn: context?.ctx?.turn,
                phase: context?.ctx?.phase,
                stateHash: options.includeStateHash ? hashState(context.G) : undefined,
                stateDelta,
                stateSnapshot: options.snapshotEveryActions && options.snapshotEveryActions > 0 && seq % options.snapshotEveryActions === 0
                    ? stateSnapshot
                    : undefined,
                matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
                seed: resolveReplaySeed(context),
                matchConfig,
                expansions: resolveReplayExpansions(matchConfig),
            };

            seq += 1;
            previousSnapshot = stateSnapshot;

            try {
                options.sink?.writeRecord(record);
                if (record.stateSnapshot) {
                    options.sink?.writeRecord({
                        recordType: 'checkpoint',
                        afterSeq: record.seq,
                        stateHash: record.stateHash ?? hashState(context.G),
                        stateSnapshot: record.stateSnapshot,
                        matchId: record.matchId,
                        seed: record.seed,
                        matchConfig: record.matchConfig,
                        expansions: record.expansions,
                    });
                }
            } catch (error) {
                options.onError?.({ error, record });
            }

            return result;
        }) as any;
    }

    return wrapped;
}

/**
 * Emits deterministic replay system records for engine-driven transitions without direct player moves.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function emitReplaySystemRecord(
    options: ReplayHookOptions | undefined,
    context: any,
    payload: ReplaySystemRoundSettlementPayload
): void {
    if (!options?.sink) return;

    const matchConfig = resolveReplayMatchConfig(context);

    const record: ReplaySystemRoundSettlementRecord = {
        recordType: 'system.roundSettlement',
        roundNumber: payload.roundNumber,
        settlementKind: payload.settlementKind,
        resortTileOrder: [...payload.resortTileOrder],
        stateHash: options.includeStateHash ? hashState(context.G) : undefined,
        matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
        seed: resolveReplaySeed(context),
        matchConfig,
        expansions: resolveReplayExpansions(matchConfig),
    };

    try {
        options.sink.writeRecord(record);
    } catch (error) {
        options.onError?.({ error, record });
    }
}
