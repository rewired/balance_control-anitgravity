import type { GameConfig } from '@balance-control/rules';
import { CoreMoves } from './moves';
import { CANONICAL_ENGINE_MODULE_ORDER, type EngineModuleId, ExpansionRegistry } from './expansion-registry';

export type MoveFn = (...args: any[]) => any;
export type MoveMap = Record<string, MoveFn>;

export type MoveModule = Readonly<{
    moduleId: EngineModuleId;
    moves: MoveMap;
}>;

function mergeMoveMapsDeterministic(into: MoveMap, from: MoveMap, moduleId: string) {
    const keys = Object.keys(from).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(into, key)) {
            throw new Error(`[moves] duplicate move id "${key}" while merging module "${moduleId}".`);
        }
        into[key] = from[key];
    }
}

export function getEnabledMoveModules(config: GameConfig): MoveModule[] {
    const expansionModules = ExpansionRegistry.getEnabledMoveModules(config);
    const byModuleId = new Map<EngineModuleId, MoveMap>();

    for (const mod of expansionModules) {
        byModuleId.set(mod.moduleId, mod.moves);
    }

    const modules: MoveModule[] = [];
    for (const moduleId of CANONICAL_ENGINE_MODULE_ORDER) {
        if (moduleId === 'core') {
            modules.push({ moduleId, moves: CoreMoves as unknown as MoveMap });
            continue;
        }
        const moves = byModuleId.get(moduleId);
        if (moves) {
            modules.push({ moduleId, moves });
        }
    }
    return modules;
}

export function mergeMoveModules(modules: readonly MoveModule[]): MoveMap {
    const merged: MoveMap = {};
    for (const module of modules) {
        mergeMoveMapsDeterministic(merged, module.moves, module.moduleId);
    }
    return merged;
}

export function buildMovesForConfig(config: GameConfig): MoveMap {
    return mergeMoveModules(getEnabledMoveModules(config));
}

export function buildExpansionMovesForConfig(config: GameConfig): MoveMap {
    const modules = getEnabledMoveModules(config).filter((m) => m.moduleId !== 'core');
    return mergeMoveModules(modules);
}

