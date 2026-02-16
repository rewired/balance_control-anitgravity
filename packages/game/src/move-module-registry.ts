import { CANONICAL_ENGINE_MODULE_ORDER, type EngineModuleId } from './expansion-registry';

export type MoveFn = (...args: any[]) => any;
export type MoveMap = Record<string, MoveFn>;

export type MoveModule = Readonly<{
    moduleId: EngineModuleId;
    moves: MoveMap;
}>;

type Conflict = {
    moveName: string;
    existingModuleId: EngineModuleId;
    moduleId: EngineModuleId;
};

/**
 * Deterministic move module registry for boardgame.io move map assembly.
 *
 * - Ordering is defined exclusively by CANONICAL_ENGINE_MODULE_ORDER (GR-003).
 * - Overrides are forbidden: duplicate move registrations throw (stable message + listing order).
 */
export class MoveModuleRegistry {
    private readonly moduleOrder: readonly EngineModuleId[];
    private readonly modules = new Map<EngineModuleId, MoveMap>();

    public constructor(moduleOrder: readonly EngineModuleId[] = CANONICAL_ENGINE_MODULE_ORDER) {
        this.moduleOrder = [...moduleOrder];
    }

    public registerModule(module: MoveModule): void {
        if (!this.moduleOrder.includes(module.moduleId)) {
            throw new Error(`MoveModuleRegistry: module id "${module.moduleId}" is not in CANONICAL_ENGINE_MODULE_ORDER.`);
        }
        if (this.modules.has(module.moduleId)) {
            throw new Error(`MoveModuleRegistry: module "${module.moduleId}" already registered.`);
        }
        this.modules.set(module.moduleId, module.moves);
    }

    public buildMoveMap(): MoveMap {
        const moveToModule = new Map<string, EngineModuleId>();
        const merged: MoveMap = {};
        const conflicts: Conflict[] = [];

        for (const moduleId of this.moduleOrder) {
            const moves = this.modules.get(moduleId);
            if (!moves) continue;

            const moveNamesSorted = Object.keys(moves).sort((a, b) => a.localeCompare(b));
            for (const moveName of moveNamesSorted) {
                const existing = moveToModule.get(moveName);
                if (existing) {
                    conflicts.push({ moveName, existingModuleId: existing, moduleId });
                    continue;
                }
                moveToModule.set(moveName, moduleId);
                merged[moveName] = moves[moveName];
            }
        }

        if (conflicts.length > 0) {
            const lines = [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                ...conflicts.map((c) => `- ${c.moduleId} registers "${c.moveName}" but it is already registered by ${c.existingModuleId}`),
            ];
            throw new Error(lines.join('\n'));
        }

        return merged;
    }
}

