import type { ExpansionFlags, ExpansionId, GameConfig, GameState, MeasureDeckDescriptor } from '@balance-control/rules';
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

/**
 * Registry for engine packs and their associated logic.
 */
class EnginePackRegistryImpl {
    private packs: Partial<Record<EnginePackId, EnginePackDefinition>> = {};

    /**
     * Resolves expansion flags from config.
     * @deterministic
     * @pure
     */
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

    /**
     * Returns manifests for all registered packs.
     * @deterministic
     * @pure
     */
    public getPackManifests(): PackManifest[] {
        const out: PackManifest[] = [];
        for (const id of CANONICAL_ENGINE_MODULE_ORDER as readonly EnginePackId[]) {
            const pack = this.packs[id];
            if (!pack) continue;
            out.push(pack.manifest);
        }
        return out;
    }

    /**
     * Validates that all enabled packs are registered and versions match if pinned.
     * @deterministic
     * @pure
     */
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

        const rootHookOwners = enabledPackIds
            .map((id) => registered.get(id))
            .filter((pack): pack is EnginePackDefinition => Boolean(pack && pack.manifest.required && (pack.turn || pack.endIf || pack.playerView || pack.setupGame || pack.wrapMovesForReplay)));
        if (rootHookOwners.length > 1) {
            const ids = rootHookOwners.map((p) => p.id).sort().join(', ');
            throw new Error(`EnginePackRegistry: more than one required pack defines setupGame/turn/endIf/playerView/wrapMovesForReplay (${ids}).`);
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

    /**
     * Registers a new engine pack.
     * @sideEffects
     */
    public registerPack(def: EnginePackDefinition): void {
        if (!def) {
            throw new Error(`EnginePackRegistry: registerPack called with undefined/null def.`);
        }
        if (!def.manifest) {
            console.error('PACK DEF WITHOUT MANIFEST:', JSON.stringify(def, (key, value) => typeof value === 'function' ? '[Function]' : value, 2));
            throw new Error(`EnginePackRegistry: pack "${def.id}" has no manifest.`);
        }
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

    /**
     * Returns all registered engine packs in canonical order.
     * @deterministic
     * @pure
     */
    public getRegisteredPacks(): EnginePackDefinition[] {
        const out: EnginePackDefinition[] = [];
        for (const id of CANONICAL_ENGINE_MODULE_ORDER as readonly EnginePackId[]) {
            const pack = this.packs[id];
            if (pack) out.push(pack);
        }
        return out;
    }

    /**
     * Returns all enabled engine packs for the current game state or config.
     * @deterministic
     * @pure
     */
    public getEnabledPacks(G?: GameState, cfg?: GameConfig): EnginePackDefinition[] {
        const enabledPackIds = this.resolveEnabledPackIds(G, cfg);
        const out: EnginePackDefinition[] = [];

        for (const id of enabledPackIds) {
            const pack = this.packs[id];
            if (pack) out.push(pack);
        }

        return out;
    }

    /**
     * Returns move modules for all registered packs.
     * @deterministic
     * @pure
     */
    public getRegisteredMoveModules(): MoveModule[] {
        const out: MoveModule[] = [];
        for (const pack of this.getRegisteredPacks()) {
            if (!pack.moves) continue;
            out.push({ moduleId: pack.id as EngineModuleId, moves: pack.moves });
        }
        return out;
    }

    /**
     * Returns move modules for enabled packs.
     * @deterministic
     * @pure
     */
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

    /**
     * Executes pre-shuffle setup hooks for all enabled packs.
     * @sideEffects
     */
    public applySetupPreShuffle(G: GameState, ctx: any, cfg?: GameConfig): void {
        const resolvedCfg =
            cfg ??
            (G.meta?.cfg as GameConfig | undefined) ??
            DEFAULT_GAME_CONFIG;

        for (const pack of this.getEnabledPacks(G, resolvedCfg)) {
            pack.setup?.preShuffle?.(G, ctx, resolvedCfg);
        }
    }

    /**
     * Executes post-shuffle setup hooks for all enabled packs.
     * @sideEffects
     */
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

    /**
     * Retrieves atoms for a measure from a specific expansion pack.
     * @expansion EXP-01-00|EXP-02-00|EXP-03-00
     * @deterministic
     * @pure
     */
    public getMeasureAtomsForExpansion(G: GameState, expansionId: ExpansionId, measureId: string, payload: any): any[] | null {
        const enabledPackIds = new Set(this.resolveEnabledPackIds(G));
        if (!enabledPackIds.has(expansionId)) {
             throw new Error(`EnginePackRegistry: expansion "${expansionId}" not found or not enabled.`);
        }

        const pack = this.packs[expansionId];
        if (!pack) {
             // This should be unreachable if resolveEnabledPackIds validates packs, but for safety:
             throw new Error(`EnginePackRegistry: expansion "${expansionId}" enabled but not registered.`);
        }

        if (pack.getMeasureAtoms) {
             return pack.getMeasureAtoms(G, measureId, payload);
        }
        return null;
    }

    /**
     * Retrieves all measure deck descriptors from enabled packs.
     * @expansion EXP-01-00|EXP-02-00|EXP-03-00
     * @deterministic
     * @pure
     */
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

    /**
     * Dispatches an effect to the appropriate expansion-specific effect handler.
     * @expansion EXP-01-00|EXP-02-00|EXP-03-00
     * @sideEffects
     */
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

    /**
     * Applies production modifiers from all enabled packs.
     * @remarks Expansion order: EXP-01-00 doubling first, then Climate modifications [EXP-03-10-04].
     * @expansion EXP-01-00|EXP-03-00
     * @deterministic
     * @pure
     * @rule EXP-03-10-04
     */
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

const ENGINE_PACK_REGISTRY_SINGLETON_KEY = '__BALANCE_CONTROL_ENGINE_PACK_REGISTRY__';

type GlobalRegistryHost = typeof globalThis & {
    [ENGINE_PACK_REGISTRY_SINGLETON_KEY]?: EnginePackRegistryImpl;
};

const globalRegistryHost = globalThis as GlobalRegistryHost;

if (!globalRegistryHost[ENGINE_PACK_REGISTRY_SINGLETON_KEY]) {
    globalRegistryHost[ENGINE_PACK_REGISTRY_SINGLETON_KEY] = new EnginePackRegistryImpl();
}

export const EnginePackRegistry = globalRegistryHost[ENGINE_PACK_REGISTRY_SINGLETON_KEY] as EnginePackRegistryImpl;
