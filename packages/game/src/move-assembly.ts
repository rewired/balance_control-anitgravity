import type { GameConfig } from '@balance-control/rules';
import { CoreMoves } from './moves';
import { CANONICAL_ENGINE_MODULE_ORDER, type EngineModuleId, ExpansionRegistry } from './expansion-registry';
import { MoveModuleRegistry, type MoveFn, type MoveMap, type MoveModule } from './move-module-registry';

export type { MoveFn, MoveMap, MoveModule };

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
