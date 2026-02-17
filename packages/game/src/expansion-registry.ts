import type { ExpansionDefinition, ExpansionFlags, ExpansionId, GameConfig, GameState, MeasureDeckDescriptor } from '@balance-control/rules';
import { DEFAULT_EXPANSION_FLAGS } from './config';
import type { EnginePackDefinition, EnginePackId } from './packs/types';
import type { MoveModule } from './move-module-registry';

/**
 * Canonical ordering for all engine modules.
 * Single source of truth: do not derive from Map insertion order, object keys, or registration side-effects.
 */
export const CANONICAL_ENGINE_MODULE_ORDER = ['core', 'exp01', 'exp02', 'exp03'] as const;
export type EngineModuleId = (typeof CANONICAL_ENGINE_MODULE_ORDER)[number];

export const CANONICAL_EXPANSION_ORDER: readonly ExpansionId[] = ['exp01', 'exp02', 'exp03'] as const;

const CANONICAL_EXPANSION_IDS = new Set<ExpansionId>(CANONICAL_EXPANSION_ORDER);
const CANONICAL_PACK_IDS = new Set<EnginePackId>(CANONICAL_ENGINE_MODULE_ORDER as unknown as EnginePackId[]);

const EXPANSION_ID_TO_FLAG_KEY: Record<ExpansionId, keyof ExpansionFlags> = {
    exp01: 'ex01',
    exp02: 'ex02',
    exp03: 'ex03',
};

/**
 * EnginePackRegistry (core-capable) is the preferred registry API.
 *
 * Backward compatibility:
 * - ExpansionRegistry is deprecated; use EnginePackRegistry / registerPack.
 * - Legacy register(def: ExpansionDefinition) remains supported for exp01..exp03 only.
 */
class EnginePackRegistryImpl {
    private packs: Partial<Record<EnginePackId, EnginePackDefinition>> = {};
    private legacyExpansions: Partial<Record<ExpansionId, ExpansionDefinition>> = {};

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

    public registerPack(def: EnginePackDefinition): void {
        if (!CANONICAL_PACK_IDS.has(def.id)) {
            throw new Error(`EnginePackRegistry: pack id "${def.id}" is not in CANONICAL_ENGINE_MODULE_ORDER.`);
        }
        if (this.packs[def.id]) {
            throw new Error(`EnginePackRegistry: pack "${def.id}" already registered.`);
        }
        this.packs[def.id] = def;
    }

    public getRegisteredPacks(): EnginePackDefinition[] {
        const out: EnginePackDefinition[] = [];
        for (const id of CANONICAL_ENGINE_MODULE_ORDER as readonly EnginePackId[]) {
            const pack = this.packs[id];
            if (pack) out.push(pack);
        }
        return out;
    }

    public getEnabledPacks(G?: GameState, cfg?: GameConfig): EnginePackDefinition[] {
        const flags = this.resolveFlags(G, cfg);
        const out: EnginePackDefinition[] = [];

        // Core is always enabled, even if not yet registered as a pack.
        const core = this.packs.core;
        out.push(core ?? { id: 'core', name: 'Core (implicit)' });

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const pack = this.packs[expId];
            if (!pack) continue;
            if (!this.isEnabled(expId, flags)) continue;
            out.push(pack);
        }

        return out;
    }

    public getRegisteredMoveModules(): MoveModule[] {
        const out: MoveModule[] = [];
        for (const pack of this.getRegisteredPacks()) {
            if (!pack.moves) continue;
            out.push({ moduleId: pack.id as EngineModuleId, moves: pack.moves });
        }
        return out;
    }

    public getEnabledMoveModules(cfg?: GameConfig): MoveModule[] {
        const flags = this.resolveFlags(undefined, cfg);
        const out: MoveModule[] = [];

        // Core is always enabled; if not registered (or has no moves), it contributes an empty module.
        out.push({ moduleId: 'core', moves: this.packs.core?.moves ?? {} });

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const pack = this.packs[expId];
            if (!pack?.moves) continue;
            if (!this.isEnabled(expId, flags)) continue;
            out.push({ moduleId: expId as EngineModuleId, moves: pack.moves });
        }

        return out;
    }

    public applySetupPreShuffle(G: GameState, ctx: any, cfg?: GameConfig): void {
        const resolvedCfg =
            cfg ??
            (G.meta?.cfg as GameConfig | undefined) ??
            ({
                expansions: { ...DEFAULT_EXPANSION_FLAGS },
            } as GameConfig);

        for (const pack of this.getEnabledPacks(G, resolvedCfg)) {
            pack.setup?.preShuffle?.(G, ctx, resolvedCfg);
        }
    }

    public applySetupPostShuffle(G: GameState, ctx: any, cfg?: GameConfig): void {
        const resolvedCfg =
            cfg ??
            (G.meta?.cfg as GameConfig | undefined) ??
            ({
                expansions: { ...DEFAULT_EXPANSION_FLAGS },
            } as GameConfig);

        for (const pack of this.getEnabledPacks(G, resolvedCfg)) {
            pack.setup?.postShuffle?.(G, ctx, resolvedCfg);
        }
    }

    public register(def: ExpansionDefinition): void {
        if (!CANONICAL_EXPANSION_IDS.has(def.id)) {
            throw new Error(`Expansion id "${def.id}" is not in CANONICAL_EXPANSION_ORDER.`);
        }

        if (this.legacyExpansions[def.id] || this.packs[def.id]) {
            throw new Error(`EnginePackRegistry: pack "${def.id}" already registered.`);
        }

        this.legacyExpansions[def.id] = def;

        const setup = def.onSetup
            ? {
                  preShuffle: (G: GameState, ctx: any, _cfg: GameConfig) => def.onSetup?.(G, ctx),
              }
            : undefined;

        this.registerPack({
            id: def.id as unknown as EnginePackId,
            name: def.name,
            moves: def.moves,
            setup,
        });
    }

    public getAll() {
        const all: ExpansionDefinition[] = [];
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.legacyExpansions[expId];
            if (exp) all.push(exp);
        }
        return all;
    }

    public getById(expId: ExpansionId): ExpansionDefinition | undefined {
        return this.legacyExpansions[expId];
    }

    public clear() {
        this.packs = {};
        this.legacyExpansions = {};
    }

    public getMergedMoves(config?: GameConfig) {
        const modules = this.getEnabledMoveModules(config);
        const merged: Record<string, (...args: any[]) => any> = {};

        for (const mod of modules) {
            const keys = Object.keys(mod.moves).sort((a, b) => a.localeCompare(b));
            for (const key of keys) {
                if (Object.prototype.hasOwnProperty.call(merged, key)) {
                    throw new Error(`[moves] duplicate move id "${key}" while merging pack "${mod.moduleId}".`);
                }
                merged[key] = mod.moves[key];
            }
        }

        return merged;
    }

    // Hook Executors
    public applySetup(G: GameState, ctx: any, config?: GameConfig) {
        this.applySetupPreShuffle(G, ctx, config);
    }

    public getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        const flags = this.resolveFlags(G);
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.legacyExpansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (exp.getMeasureAtoms) {
                const atoms = exp.getMeasureAtoms(G, measureId, payload);
                if (atoms) return atoms;
            }
        }
        return null;
    }

    public getMeasureDeckDescriptors(G: GameState): Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> {
        const flags = this.resolveFlags(G);
        const out: Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> = [];

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.legacyExpansions[expId];
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

    public applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any, config?: GameConfig) {
        const flags = this.resolveFlags(G, config);
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.legacyExpansions[expId];
            if (!exp) continue;
            if (!this.isEnabled(expId, flags)) continue;
            if (exp.effectHandlers && exp.effectHandlers[effect.type]) {
                exp.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        }
    }

    public applyProductionModifiers(G: GameState, tileId: string, baseAmount: number, config?: GameConfig): number {
        const flags = this.resolveFlags(G, config);
        let amount = baseAmount;

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            const exp = this.legacyExpansions[expId];
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

export const EnginePackRegistry = new EnginePackRegistryImpl();

/** @deprecated Use EnginePackRegistry / registerPack. */
export const ExpansionRegistry = EnginePackRegistry;
