import type { ExpansionDefinition, ExpansionFlags, ExpansionId, GameConfig, GameState, MeasureDeckDescriptor } from '@balance-control/rules';
import { DEFAULT_EXPANSION_FLAGS, DEFAULT_GAME_CONFIG } from './config';
import type { EnginePackDefinition, EnginePackId, PackManifest } from './packs/types';
import type { MoveModule } from './move-module-registry';

export const CANONICAL_ENGINE_MODULE_ORDER = ['core', 'exp01', 'exp02', 'exp03'] as const;
export type EngineModuleId = (typeof CANONICAL_ENGINE_MODULE_ORDER)[number];

export const CANONICAL_EXPANSION_ORDER: readonly ExpansionId[] = ['exp01', 'exp02', 'exp03'] as const;

const CANONICAL_PACK_IDS = new Set<EnginePackId>(CANONICAL_ENGINE_MODULE_ORDER as unknown as EnginePackId[]);

const EXPANSION_ID_TO_FLAG_KEY: Record<ExpansionId, keyof ExpansionFlags> = {
    exp01: 'ex01',
    exp02: 'ex02',
    exp03: 'ex03',
};

export function packFromExpansionDefinition(def: ExpansionDefinition): EnginePackDefinition {
    const setup = def.onSetup
        ? {
              preShuffle: (G: GameState, ctx: any, _cfg: GameConfig) => def.onSetup?.(G, ctx),
          }
        : undefined;
    const versionMap: Record<ExpansionId, string> = {
        exp01: '1.3.0',
        exp02: '1.0.0',
        exp03: '1.0.0',
    };
    const manifest: PackManifest = {
        id: def.id as EnginePackId,
        packVersion: versionMap[def.id] ?? '0.0.0',
        rulesetAnchor: `${def.id.toUpperCase().replace('EXP', 'EXP-')} v${versionMap[def.id] ?? '0.0.0'}`,
        required: false,
    };

    return {
        id: def.id as EnginePackId,
        name: def.name,
        manifest,
        moves: def.moves,
        resources: def.resources,
        zones: def.zones,
        measureDecks: def.measureDecks,
        modifiers: def.modifiers,
        effectHandlers: def.effectHandlers,
        getMeasureAtoms: def.getMeasureAtoms,
        setup,
    };
}

class EnginePackRegistryImpl {
    private packs: Partial<Record<EnginePackId, EnginePackDefinition>> = {};

    private resolveFlags(config?: GameConfig): ExpansionFlags {
        const candidate = config?.expansions;
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

    private resolveEnabledPackIds(G?: GameState, config?: GameConfig): EnginePackId[] {
        const resolvedConfig = config ?? G?.meta?.cfg ?? DEFAULT_GAME_CONFIG;
        const enabledFromConfig = resolvedConfig.packs?.enabledPacks;
        let requestedPackIds: string[];

        if (Array.isArray(enabledFromConfig)) {
            requestedPackIds = [...enabledFromConfig];
        } else {
            const flags = this.resolveFlags(resolvedConfig);
            requestedPackIds = [];
            for (const expId of CANONICAL_EXPANSION_ORDER) {
                if (this.isEnabled(expId, flags)) {
                    requestedPackIds.push(expId);
                }
            }
        }

        const seen = new Set<string>();
        const normalized: string[] = [];
        for (const id of requestedPackIds) {
            if (typeof id !== 'string') continue;
            if (seen.has(id)) continue;
            seen.add(id);
            normalized.push(id);
        }

        if (!normalized.includes('core')) {
            normalized.unshift('core');
        }

        for (const id of normalized) {
            if (!CANONICAL_PACK_IDS.has(id as EnginePackId)) {
                throw new Error(`EnginePackRegistry: unknown pack id "${id}".`);
            }
        }

        const enabledPackIds = (CANONICAL_ENGINE_MODULE_ORDER as readonly EnginePackId[]).filter((id) => normalized.includes(id));
        this.validateEnabledPacks(enabledPackIds, resolvedConfig.packs?.pinnedVersions);
        return enabledPackIds;
    }

    public getPackManifests(): PackManifest[] {
        const out: PackManifest[] = [];
        for (const id of CANONICAL_ENGINE_MODULE_ORDER as readonly EnginePackId[]) {
            const pack = this.packs[id];
            if (!pack) continue;
            out.push(pack.manifest);
        }
        return out;
    }

    public validateEnabledPacks(enabledPackIds: EnginePackId[], pinnedVersions?: Partial<Record<ExpansionId, string>>): void {
        const registered = new Map<EnginePackId, EnginePackDefinition>();
        for (const pack of this.getRegisteredPacks()) {
            registered.set(pack.id, pack);
        }

        for (const id of enabledPackIds) {
            if (!registered.has(id)) {
                throw new Error(`EnginePackRegistry: pack "${id}" is not registered.`);
            }
        }

        for (const pack of registered.values()) {
            if (pack.manifest.required && !enabledPackIds.includes(pack.id)) {
                throw new Error(`EnginePackRegistry: required pack "${pack.id}" is missing.`);
            }
        }

        if (pinnedVersions) {
            for (const [id, pinnedVersion] of Object.entries(pinnedVersions)) {
                if (!pinnedVersion) continue;
                if (!CANONICAL_PACK_IDS.has(id as EnginePackId)) {
                    throw new Error(`EnginePackRegistry: unknown pack id "${id}".`);
                }
                const packId = id as EnginePackId;
                const pack = registered.get(packId);
                if (!pack) {
                    throw new Error(`EnginePackRegistry: pack "${packId}" is not registered.`);
                }
                if (pack.manifest.packVersion !== pinnedVersion) {
                    throw new Error(
                        `EnginePackRegistry: pack "${packId}" version "${pack.manifest.packVersion}" does not match pinned "${pinnedVersion}".`
                    );
                }
            }
        }
    }

    public registerPack(def: EnginePackDefinition): void {
        if (!CANONICAL_PACK_IDS.has(def.id)) {
            throw new Error(`EnginePackRegistry: pack id "${def.id}" is not in CANONICAL_ENGINE_MODULE_ORDER.`);
        }
        if (def.manifest.id !== def.id) {
            throw new Error(`EnginePackRegistry: pack "${def.id}" manifest id "${def.manifest.id}" mismatch.`);
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
        const enabledPackIds = this.resolveEnabledPackIds(G, cfg);
        const out: EnginePackDefinition[] = [];

        for (const id of enabledPackIds) {
            const pack = this.packs[id];
            if (pack) out.push(pack);
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
        const enabledPackIds = new Set(this.resolveEnabledPackIds(undefined, cfg));
        const out: MoveModule[] = [];

        for (const id of CANONICAL_ENGINE_MODULE_ORDER) {
            if (!enabledPackIds.has(id)) continue;
            const pack = this.packs[id];
            if (!pack?.moves) continue;
            out.push({ moduleId: id as EngineModuleId, moves: pack.moves });
        }

        return out;
    }

    public applySetupPreShuffle(G: GameState, ctx: any, cfg?: GameConfig): void {
        const resolvedCfg =
            cfg ??
            (G.meta?.cfg as GameConfig | undefined) ??
            DEFAULT_GAME_CONFIG;

        for (const pack of this.getEnabledPacks(G, resolvedCfg)) {
            pack.setup?.preShuffle?.(G, ctx, resolvedCfg);
        }
    }

    public applySetupPostShuffle(G: GameState, ctx: any, cfg?: GameConfig): void {
        const resolvedCfg =
            cfg ??
            (G.meta?.cfg as GameConfig | undefined) ??
            DEFAULT_GAME_CONFIG;

        for (const pack of this.getEnabledPacks(G, resolvedCfg)) {
            pack.setup?.postShuffle?.(G, ctx, resolvedCfg);
        }
    }

    public clear() {
        this.packs = {};
    }

    public getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        const enabledPackIds = new Set(this.resolveEnabledPackIds(G));
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            if (!enabledPackIds.has(expId)) continue;
            const pack = this.packs[expId];
            if (!pack) continue;
            if (pack.getMeasureAtoms) {
                const atoms = pack.getMeasureAtoms(G, measureId, payload);
                if (atoms) return atoms;
            }
        }
        return null;
    }

    public getMeasureDeckDescriptors(G: GameState): Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> {
        const enabledPackIds = new Set(this.resolveEnabledPackIds(G));
        const out: Array<{ expansionId: ExpansionId; deck: MeasureDeckDescriptor }> = [];

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            if (!enabledPackIds.has(expId)) continue;
            const pack = this.packs[expId];
            if (!pack) continue;
            if (!pack.measureDecks || pack.measureDecks.length === 0) continue;

            const decksSorted = [...pack.measureDecks].sort((a, b) => a.id.localeCompare(b.id));
            for (const deck of decksSorted) {
                out.push({ expansionId: expId, deck });
            }
        }

        return out;
    }

    public applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any, config?: GameConfig) {
        const enabledPackIds = new Set(this.resolveEnabledPackIds(G, config));
        for (const expId of CANONICAL_EXPANSION_ORDER) {
            if (!enabledPackIds.has(expId)) continue;
            const pack = this.packs[expId];
            if (!pack) continue;
            if (pack.effectHandlers && pack.effectHandlers[effect.type]) {
                pack.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        }
    }

    public applyProductionModifiers(G: GameState, tileId: string, baseAmount: number, config?: GameConfig): number {
        const enabledPackIds = new Set(this.resolveEnabledPackIds(G, config));
        let amount = baseAmount;

        for (const expId of CANONICAL_EXPANSION_ORDER) {
            if (!enabledPackIds.has(expId)) continue;
            const pack = this.packs[expId];
            if (!pack) continue;
            const productionModifier = pack.modifiers?.production;
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
