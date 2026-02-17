import type { GameConfig } from '@balance-control/rules';
import { CANONICAL_ENGINE_MODULE_ORDER, EnginePackRegistry } from './expansion-registry';
import { MoveModuleRegistry, type MoveFn, type MoveMap, type MoveModule } from './move-module-registry';
import { ensureCorePackRegistered } from './packs/register-core';

export type { MoveFn, MoveMap, MoveModule };

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
