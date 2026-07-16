import { Game } from 'boardgame.io';
import { GameState } from '@balance-control/rules';
import { SetupGame } from './setup';
import { assemblePacks, buildStageMoveMap, type MoveMap } from './move-assembly';
import { ensureCorePackRegistered } from './packs/register-core';
import { EnginePackRegistry } from './expansion-registry';
import { withReplaySink, type ReplayHookOptions } from './engine/replay-sink';

function selectMoves(mergedMoves: MoveMap, moveIds: readonly string[], stageName: string): MoveMap {
    const out: MoveMap = {};
    for (const moveId of moveIds) {
        const move = mergedMoves[moveId];
        if (typeof move !== 'function') {
            throw new Error(
                `Core pack not registered or missing required move "${moveId}" for ${stageName}. Register CorePack before calling createBalanceControlGame().`
            );
        }
        out[moveId] = move;
    }
    return out;
}

/**
 * Factory for creating the Balance Control game configuration.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function createBalanceControlGame(): Game<GameState> {
    return createBalanceControlGameWithHooks();
}

/**
 * Factory for creating the Balance Control game configuration with optional infrastructure hooks.
 *
 * Turn structure, win condition, and player-view masking are sourced from the
 * single required pack's `turn`/`endIf`/`playerView` contract (see DD-0366) —
 * this factory itself is ruleset-agnostic and does not hardcode CORE
 * ruleset specifics.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function createBalanceControlGameWithHooks(replayHook?: ReplayHookOptions): Game<GameState> {
    ensureCorePackRegistered();
    const packAssembly = assemblePacks({ mode: 'registered' });
    const moveModules = packAssembly.moveModules;
    const mergedMoves = withReplaySink(packAssembly.moves, replayHook);

    const requiredPack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.manifest.required);
    if (!requiredPack || !requiredPack.turn || !requiredPack.endIf || !requiredPack.playerView) {
        throw new Error(
            'createBalanceControlGameWithHooks: the required pack must supply turn/endIf/playerView. Register a required pack (e.g. CorePack) that populates these fields before calling this factory.'
        );
    }
    const rootTurn = requiredPack.turn;

    const expansionModules = moveModules.filter((module) => module.moduleId !== requiredPack.id).map((module) => {
        const wrappedModuleMoves: MoveMap = {};
        for (const moveId of Object.keys(module.moves)) {
            const wrappedMove = mergedMoves[moveId];
            if (typeof wrappedMove === 'function') {
                wrappedModuleMoves[moveId] = wrappedMove;
            }
        }
        return {
            ...module,
            moves: wrappedModuleMoves,
        };
    });

    const rootMoves = selectMoves(mergedMoves, rootTurn.rootMoveIds, 'root/system');

    const stages: Record<string, { moves: MoveMap; next?: string }> = {};
    for (const [stageName, descriptor] of Object.entries(rootTurn.stages)) {
        const stageOwnMoves = selectMoves(mergedMoves, descriptor.moves, stageName);
        stages[stageName] = {
            moves: descriptor.mergeExpansionMoves ? buildStageMoveMap(stageOwnMoves, expansionModules) : stageOwnMoves,
            next: descriptor.next,
        };
    }

    return {
        name: 'balance-control',
        setup: (ctx: any, setupData: unknown) => SetupGame({ ctx, setupData }),
        moves: rootMoves as any,
        playerView: ({ G, playerID }: { G: GameState; playerID: string | null }) => {
            return requiredPack.playerView!(G, playerID);
        },
        endIf: requiredPack.endIf as any,
        turn: {
            order: rootTurn.order,
            activePlayers: rootTurn.activePlayers,
            stages,
            onBegin: (args: any) => rootTurn.onBegin?.({ ...args, replayHook }),
            onEnd: (args: any) => rootTurn.onEnd?.({ ...args, replayHook }),
        },
    };
}

/** @rule CORE-01-09-02 */

export { EnginePackRegistry } from './expansion-registry';
export type { EnginePackDefinition, EnginePackId, PackManifest } from './packs/types';
export { CorePack } from './packs/core';
export * from './move-contracts';
export * from './config';
export * from './hash-state';
export * from './surface';
export * from './engine/legal-intents';
export { selectTileController } from './public-selectors';
export { assemblePacks } from './move-assembly';
export { CANONICAL_ENGINE_MODULE_ORDER } from './expansion-registry';

// Internal APIs exposed for pack implementations in @balance-control/packs
export { EffectResolver } from './engine/resolver';
export { lookupMeasureDeckForObjectId } from './engine/measure-deck-provider';
export { exp02RegulationAtoms } from './engine/atoms/regulation';
export { exp03CountdownAtoms } from './engine/atoms/countdown';

export type {
    ReplayActionRecord,
    ReplayCheckpointRoundEndRecord,
    ReplayCheckpointTurnEndRecord,
    ReplayManifestRecord,
    ReplayRecord,
    ReplaySink,
    ReplayHookOptions,
    ReplaySystemChoiceOpenedRecord,
    ReplaySystemHotspotResolvedRecord,
    ReplaySystemRoundSettlementRecord,
} from './engine/replay-sink';
export type { ReplayDomainFieldType, ReplayTypedFields } from './engine/replay-typed-fields';

export { verifyReplayRecords, type ReplayNdjsonRecord, type ReplayVerifyOptions } from './replay-verify';
