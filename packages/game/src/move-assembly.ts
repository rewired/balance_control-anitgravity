import type { GameConfig } from '@balance-control/rules';
import { CoreMoves } from './moves';
import { CANONICAL_ENGINE_MODULE_ORDER, EnginePackRegistry } from './expansion-registry';
import { MoveModuleRegistry, type MoveFn, type MoveMap, type MoveModule } from './move-module-registry';

export type { MoveFn, MoveMap, MoveModule };

export function getEnabledMoveModules(config: GameConfig): MoveModule[] {
    const modules = EnginePackRegistry.getEnabledMoveModules(config);
    const out: MoveModule[] = [];

    for (const moduleId of CANONICAL_ENGINE_MODULE_ORDER) {
        const mod = modules.find((m) => m.moduleId === moduleId);
        if (!mod && moduleId !== 'core') continue;
        if (moduleId === 'core') {
            const moves = mod?.moves && Object.keys(mod.moves).length > 0 ? mod.moves : (CoreMoves as unknown as MoveMap);
            out.push({ moduleId, moves });
            continue;
        }
        if (mod) out.push(mod);
    }

    return out;
}

export function getMoveModulesSuperset(): MoveModule[] {
    const modules = EnginePackRegistry.getRegisteredMoveModules();
    const out: MoveModule[] = [];

    for (const moduleId of CANONICAL_ENGINE_MODULE_ORDER) {
        const mod = modules.find((m) => m.moduleId === moduleId);
        if (!mod && moduleId !== 'core') continue;
        if (moduleId === 'core') {
            const moves = mod?.moves && Object.keys(mod.moves).length > 0 ? mod.moves : (CoreMoves as unknown as MoveMap);
            out.push({ moduleId, moves });
            continue;
        }
        if (mod) out.push(mod);
    }

    return out;
}

export function mergeMoveModules(modules: readonly MoveModule[]): MoveMap {
    const reg = new MoveModuleRegistry(CANONICAL_ENGINE_MODULE_ORDER);
    for (const module of modules) {
        reg.registerModule(module);
    }
    return reg.buildMoveMap();
}

export function buildMovesForConfig(config: GameConfig): MoveMap {
    return mergeMoveModules(getEnabledMoveModules(config));
}

export function buildExpansionMovesForConfig(config: GameConfig): MoveMap {
    const modules = getEnabledMoveModules(config).filter((m) => m.moduleId !== 'core');
    return mergeMoveModules(modules);
}

export function buildMovesSuperset(): MoveMap {
    return mergeMoveModules(getMoveModulesSuperset());
}

export function buildExpansionMovesSuperset(): MoveMap {
    const modules = getMoveModulesSuperset().filter((m) => m.moduleId !== 'core');
    return mergeMoveModules(modules);
}
