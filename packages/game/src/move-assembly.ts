import type { GameConfig, GameState } from '@balance-control/rules';
import { DEFAULT_GAME_CONFIG } from './config';
import { CANONICAL_ENGINE_MODULE_ORDER, EnginePackRegistry } from './expansion-registry';
import type { AtomHandler } from './engine/engine-module-registry';
import { EngineModuleRegistry } from './engine/engine-module-registry';
import type { EngineState, HookPoint } from './engine/types';
import { MoveModuleRegistry, type MoveFn, type MoveMap, type MoveModule } from './move-module-registry';
import type { EnginePackDefinition } from './packs/types';
import { ensureCorePackRegistered } from './packs/register-core';

export type { MoveFn, MoveMap, MoveModule };

export type PackAssemblyMode = 'enabled' | 'registered';

export type PackAssembly = Readonly<{
    mode: PackAssemblyMode;
    config: GameConfig;
    packs: EnginePackDefinition[];
    moveModules: MoveModule[];
    moves: MoveMap;
    expansionMoveModules: MoveModule[];
    expansionMoves: MoveMap;
    applySetupPreShuffle: (G: GameState, ctx: any) => void;
    applySetupPostShuffle: (G: GameState, ctx: any) => void;
    buildAtomDispatch: (
        G: GameState & { engine: EngineState },
        triggerHook: (G2: GameState & { engine: EngineState }, ctx2: any, hook: HookPoint, payload?: any) => void
    ) => ReadonlyMap<string, AtomHandler>;
}>;

/**
 * Returns the enabled move modules for a given configuration.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function getEnabledMoveModules(config: GameConfig): MoveModule[] {
    ensureCorePackRegistered();
    const modules = EnginePackRegistry.getEnabledMoveModules(config);
    const out: MoveModule[] = [];

    for (const moduleId of CANONICAL_ENGINE_MODULE_ORDER) {
        const mod = modules.find((m) => m.moduleId === moduleId);
        if (!mod) continue;
        out.push(mod);
    }

    return out;
}

/**
 * Returns the superset of all registered move modules.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function getMoveModulesSuperset(): MoveModule[] {
    ensureCorePackRegistered();
    const modules = EnginePackRegistry.getRegisteredMoveModules();
    const out: MoveModule[] = [];

    for (const moduleId of CANONICAL_ENGINE_MODULE_ORDER) {
        const mod = modules.find((m) => m.moduleId === moduleId);
        if (!mod) continue;
        out.push(mod);
    }

    return out;
}

function mergeMoveModules(modules: readonly MoveModule[]): MoveMap {
    const reg = new MoveModuleRegistry(CANONICAL_ENGINE_MODULE_ORDER);
    for (const module of modules) {
        reg.registerModule(module);
    }
    return reg.buildMoveMap();
}

/**
 * Assembles the packs based on the provided configuration and mode.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function assemblePacks(options: { config?: GameConfig; mode?: PackAssemblyMode }): PackAssembly {
    ensureCorePackRegistered();
    const mode = options.mode ?? 'enabled';
    const config: GameConfig = options.config ?? DEFAULT_GAME_CONFIG;

    const packs =
        mode === 'registered' ? EnginePackRegistry.getRegisteredPacks() : EnginePackRegistry.getEnabledPacks(undefined, config);

    const moveModules = mode === 'registered' ? getMoveModulesSuperset() : getEnabledMoveModules(config);
    const moves = mergeMoveModules(moveModules);
    const expansionMoveModules = moveModules.filter((m) => m.moduleId !== 'core');
    const expansionMoves = mergeMoveModules(expansionMoveModules);

    const applySetupPreShuffle = (G: GameState, ctx: any) => {
        EnginePackRegistry.applySetupPreShuffle(G, ctx, config);
    };

    const applySetupPostShuffle = (G: GameState, ctx: any) => {
        EnginePackRegistry.applySetupPostShuffle(G, ctx, config);
    };

    const buildAtomDispatch = (
        G: GameState & { engine: EngineState },
        triggerHook: (G2: GameState & { engine: EngineState }, ctx2: any, hook: HookPoint, payload?: any) => void
    ) => {
        const registry = new EngineModuleRegistry();
        const enabledPackIds = new Set(EnginePackRegistry.getEnabledPacks(undefined, config).map((pack) => pack.id));
        const registeredPacks = EnginePackRegistry.getRegisteredPacks();

        for (const pack of registeredPacks) {
            const atoms =
                pack.engine?.atoms?.({
                    triggerHook: (G2, ctx2, hook, payload) => triggerHook(G2 as any, ctx2, hook, payload),
                }) ?? [];
            if (pack.id !== 'core' && atoms.length === 0) continue;
            registry.registerModule({
                id: pack.id,
                isEnabled: () => (pack.id === 'core' ? true : enabledPackIds.has(pack.id)),
                atoms,
            });
        }

        return registry.buildAtomDispatch(G);
    };

    return {
        mode,
        config,
        packs,
        moveModules,
        moves,
        expansionMoveModules,
        expansionMoves,
        applySetupPreShuffle,
        applySetupPostShuffle,
        buildAtomDispatch,
    };
}

/**
 * Builds the moves for a given configuration.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function buildMovesForConfig(config: GameConfig): MoveMap {
    return assemblePacks({ config, mode: 'enabled' }).moves;
}

/**
 * Builds the expansion moves for a given configuration.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function buildExpansionMovesForConfig(config: GameConfig): MoveMap {
    return assemblePacks({ config, mode: 'enabled' }).expansionMoves;
}

/**
 * Builds the superset of all registered moves.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function buildMovesSuperset(): MoveMap {
    return assemblePacks({ mode: 'registered' }).moves;
}

/**
 * Builds the superset of all registered expansion moves.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function buildExpansionMovesSuperset(): MoveMap {
    return assemblePacks({ mode: 'registered' }).expansionMoves;
}

/**
 * Builds a stage move map from core stage moves and expansion modules.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function buildStageMoveMap(coreStageMoves: MoveMap, expansionModules: MoveModule[]): MoveMap {
    return mergeMoveModules([{ moduleId: 'core', moves: coreStageMoves }, ...expansionModules]);
}
