import type { ExpansionDefinition, ExpansionFlags, ExpansionId, GameConfig, GameState, MeasureDeckDescriptor } from '@balance-control/rules';
import { DEFAULT_EXPANSION_FLAGS } from './config';

/**
 * Canonical ordering for all engine modules.
 * Single source of truth: do not derive from Map insertion order, object keys, or registration side-effects.
 */
export const CANONICAL_ENGINE_MODULE_ORDER = ['core', 'exp01', 'exp02', 'exp03'] as const;
export type EngineModuleId = (typeof CANONICAL_ENGINE_MODULE_ORDER)[number];

export const CANONICAL_EXPANSION_ORDER: readonly ExpansionId[] = ['exp01', 'exp02', 'exp03'] as const;

const CANONICAL_EXPANSION_IDS = new Set<ExpansionId>(CANONICAL_EXPANSION_ORDER);

const EXPANSION_ID_TO_FLAG_KEY: Record<ExpansionId, keyof ExpansionFlags> = {
    exp01: 'ex01',
    exp02: 'ex02',
    exp03: 'ex03',
};

class Registry {
    private expansions: Partial<Record<ExpansionId, ExpansionDefinition>> = {};

    private resolveFlags(G?: GameState, config?: GameConfig): ExpansionFlags {
        const candidate = config?.expansions ?? G?.meta?.cfg?.expansions;
        if (!candidate) return { ...DEFAULT_EXPANSION_FLAGS };

        return {
            ex01: candidate.ex01 === true,
            ex02: candidate.ex02 === true,
            ex03: candidate.ex03 === true,
        };
    }

    private isEnabled(expId: ExpansionId, flags: ExpansionFlags): boolean {
        const flagKey = EXPANSION_ID_TO_FLAG_KEY[expId];
        return flags[flagKey] === true;
    }

    register(def: ExpansionDefinition) {
        if (!CANONICAL_EXPANSION_IDS.has(def.id)) {
            throw new Error(`Expansion id "${def.id}" is not in CANONICAL_EXPANSION_ORDER.`);
        }

        if (this.expansions[def.id]) {
            console.warn(`Expansion ${def.id} already registered.`);
            return;
        }
        this.expansions[def.id] = def;
        console.log(`Expansion registered: ${def.id}`);
    }

    getAll() {
        const all: ExpansionDefinition[] = [];
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (exp) all.push(exp);
        }
        return all;
    }

    getById(expId: ExpansionId): ExpansionDefinition | undefined {
        return this.expansions[expId];
    }

    clear() {
        this.expansions = {};
    }

    getEnabledMoveModules(config?: GameConfig): Array<{ moduleId: EngineModuleId; expansionId: ExpansionId; moves: Record<string, (...args: any[]) => any> }> {
        const flags = this.resolveFlags(undefined, config);
        const modules: Array<{ moduleId: EngineModuleId; expansionId: ExpansionId; moves: Record<string, (...args: any[]) => any> }> = [];

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            const moves = exp.moves ?? {};
            modules.push({ moduleId: expId as EngineModuleId, expansionId: expId, moves });
        }

        return modules;
    }

    getMergedMoves(config?: GameConfig) {
        const modules = this.getEnabledMoveModules(config);
        const merged: Record<string, (...args: any[]) => any> = {};

        for (const mod of modules) {
            const keys = Object.keys(mod.moves).sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                if (Object.prototype.hasOwnProperty.call(merged, key)) {
                    throw new Error(`[moves] duplicate move id "${key}" while merging expansion "${mod.expansionId}".`);
                }
                merged[key] = mod.moves[key];
            }
        }

        return merged;
    }

    // Hook Executors
    applySetup(G: GameState, ctx: any, config?: GameConfig) {
        const flags = this.resolveFlags(G, config);
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (exp.onSetup) exp.onSetup(G, ctx);
        }
    }

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        const flags = this.resolveFlags(G);
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (exp.getMeasureAtoms) {
                const atoms = exp.getMeasureAtoms(G, measureId, payload);
                if (atoms) return atoms;
            }
        }
        return null;
    }

    getMeasureDeckDescriptors(G: GameState): Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> {
        const flags = this.resolveFlags(G);
        const out: Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> = [];

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (!exp.measureDecks || exp.measureDecks.length === 0) continue;

            const decksSorted = [...exp.measureDecks].sort((a, b) => a.id.localeCompare(b.id));
            for (const deck of decksSorted) {
                out.push({ expansionId: expId, deck });
            }
        }

        return out;
    }

    applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any, config?: GameConfig) {
        const flags = this.resolveFlags(G, config);
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (exp.effectHandlers && exp.effectHandlers[effect.type]) {
                exp.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        }
    }

    applyProductionModifiers(G: GameState, tileId: string, baseAmount: number, config?: GameConfig): number {
        const flags = this.resolveFlags(G, config);
        let amount = baseAmount;

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.expansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            const productionModifier = exp.modifiers?.production;
            if (!productionModifier) continue;

            const nextAmount = productionModifier(tileId, G, amount);
            if (typeof nextAmount === 'number' && Number.isFinite(nextAmount)) {
                amount = nextAmount;
            }
        }

        return amount;
    }
    // ... other hooks
}

export const ExpansionRegistry = new Registry();
