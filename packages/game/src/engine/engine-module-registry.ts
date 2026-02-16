import type { GameState } from '@balance-control/rules';
import { CANONICAL_ENGINE_MODULE_ORDER, type EngineModuleId } from '../expansion-registry';

export type AtomHandler = (G: GameState & any, ctx: any, atom: any) => boolean | void;

export interface AtomRegistration {
    kind: string;
    handler: AtomHandler;
}

export interface EngineModuleDefinition {
    id: EngineModuleId;
    isEnabled: (G: GameState & any) => boolean;
    atoms: readonly AtomRegistration[];
}

type Conflict = {
    kind: string;
    existingModuleId: EngineModuleId;
    moduleId: EngineModuleId;
};

/**
 * Deterministic engine module registry for EffectAtom dispatch.
 *
 * - Ordering is defined exclusively by CANONICAL_ENGINE_MODULE_ORDER (GR-003).
 * - Overrides are forbidden: duplicate atom.kind registration throws (stable message).
 * - Core is mandatory and must be registered.
 */
export class EngineModuleRegistry {
    private readonly moduleOrder: readonly EngineModuleId[];
    private readonly modules = new Map<EngineModuleId, EngineModuleDefinition>();

    public constructor(moduleOrder: readonly EngineModuleId[] = CANONICAL_ENGINE_MODULE_ORDER) {
        this.moduleOrder = [...moduleOrder];
    }

    public registerModule(def: EngineModuleDefinition): void {
        if (!this.moduleOrder.includes(def.id)) {
            throw new Error(`EngineModuleRegistry: module id "${def.id}" is not in CANONICAL_ENGINE_MODULE_ORDER.`);
        }
        if (this.modules.has(def.id)) {
            throw new Error(`EngineModuleRegistry: module "${def.id}" already registered.`);
        }
        this.modules.set(def.id, def);
    }

    public buildAtomDispatch(G: GameState & any): ReadonlyMap<string, AtomHandler> {
        const core = this.modules.get('core');
        if (!core) {
            throw new Error('EngineModuleRegistry: core module must be registered.');
        }
        if (!core.isEnabled(G)) {
            throw new Error('EngineModuleRegistry: core module must be enabled.');
        }

        const kindToModule = new Map<string, EngineModuleId>();
        const kindToHandler = new Map<string, AtomHandler>();
        const conflicts: Conflict[] = [];

        for (const moduleId of this.moduleOrder) {
            const mod = this.modules.get(moduleId);
            if (!mod) continue;
            if (moduleId !== 'core' && !mod.isEnabled(G)) continue;

            const atomsSorted = [...mod.atoms].sort((a, b) => a.kind.localeCompare(b.kind));
            for (const reg of atomsSorted) {
                const existing = kindToModule.get(reg.kind);
                if (existing) {
                    conflicts.push({ kind: reg.kind, existingModuleId: existing, moduleId });
                    continue;
                }
                kindToModule.set(reg.kind, moduleId);
                kindToHandler.set(reg.kind, reg.handler);
            }
        }

        if (conflicts.length > 0) {
            const lines = [
                'EngineModuleRegistry: duplicate atom.kind registrations are forbidden.',
                'Conflicts:',
                ...conflicts.map(c => `- ${c.moduleId} registers "${c.kind}" but it is already registered by ${c.existingModuleId}`)
            ];
            throw new Error(lines.join('\n'));
        }

        return kindToHandler;
    }
}

