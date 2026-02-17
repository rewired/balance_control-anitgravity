import { GameState, CoreZoneNames, TileType, CoreResources, RULESET_MANIFEST, RulesetManifest } from '@balance-control/rules';
import { Ctx } from 'boardgame.io';
import { EnginePackRegistry } from './expansion-registry';
import { normalizeGameConfig } from './config';
import { CorePack } from './packs/core';
import { ensureCorePackRegistered } from './packs/register-core';

function normalizeBoardgameCtx(ctx: any): Ctx {
    if (ctx && typeof ctx === 'object' && (ctx as any).ctx && typeof (ctx as any).ctx === 'object') {
        const inner = (ctx as any).ctx as Ctx;
        const random = (ctx as any).random ?? (inner as any).random;
        return { ...(inner as any), random } as any;
    }
    return ctx as Ctx;
}

export const SetupGame = ({ ctx, setupData }: { ctx: Ctx, setupData?: unknown }): GameState => {
    const normalizedCtx = normalizeBoardgameCtx(ctx);

    const gameConfig = normalizeGameConfig(setupData);
    const rulesetBase: RulesetManifest = RULESET_MANIFEST ?? {
        coreVersion: 'v1.1.0',
        expansions: {
            exp01Version: 'v1.3',
            exp02Version: 'v1.0',
            exp03Version: 'v1.0'
        },
        specAnchorHash: '5F563AFF09ADCAF45B62E5CBBB97C5DC5D722EE2B56E3AB67B7B71BEA2F9FEF3'
    };
    const rulesetExpansions: RulesetManifest['expansions'] = {};
    if (gameConfig.expansions.ex01) {
        rulesetExpansions.exp01Version = rulesetBase.expansions.exp01Version;
    }
    if (gameConfig.expansions.ex02) {
        rulesetExpansions.exp02Version = rulesetBase.expansions.exp02Version;
    }
    if (gameConfig.expansions.ex03) {
        rulesetExpansions.exp03Version = rulesetBase.expansions.exp03Version;
    }
    const rulesetManifest: RulesetManifest = {
        coreVersion: rulesetBase.coreVersion,
        expansions: rulesetExpansions,
        specAnchorHash: rulesetBase.specAnchorHash,
    };

    const G: GameState = {
        zones: {},
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
        meta: {
            ruleset: rulesetManifest,
            cfg: gameConfig,
        },
        engine: {
            idSeq: 0,
            effectQueue: [],
            activeModifiers: [],
            history: [],
            attributes: {
                limits: {
                    'politicalAction': 1,
                    'measure.hold': 2,
                    'measure.play': 1,
                    'startCommittee': 1
                },
                prohibitions: {},
                usage: {},
                tileExtraCosts: {},
                playerExtraCosts: {},
                climateCostRules: [],
                enabledExpansions: { ...gameConfig.expansions }
            }
        },
    };

    ensureCorePackRegistered();

    CorePack.setup?.preShuffle?.(G, normalizedCtx, gameConfig);

    // 4. Apply enabled expansions before the one final setup shuffle.
    EnginePackRegistry.applySetupPreShuffle(G, normalizedCtx, gameConfig);

    // CORE-01-03-02B: Canonical Pre-Shuffle Ordering before shuffle
    G.zones[CoreZoneNames.DrawPile].items = sortDrawPileCanonical(G);

    // CORE-01-03-02 / CORE-01-03-02A.1: Canonical Fisher-Yates shuffle (i from n-1 down to 1, j = RNG.nextInt(i+1))
    if (normalizedCtx && (normalizedCtx as any).random) {
        G.zones[CoreZoneNames.DrawPile].items = shuffleFisherYates(
            G.zones[CoreZoneNames.DrawPile].items,
            (normalizedCtx as any).random
        );
    }

    EnginePackRegistry.applySetupPostShuffle(G, normalizedCtx, gameConfig);

    return G;
};

/** CORE-01-03-02A.1: Fisher-Yates shuffle; j = RNG.nextInt(i+1). Uses ctx.random for determinism. */
function shuffleFisherYates<T>(arr: T[], random: { Die?: (n: number) => number; Shuffle?: (a: T[]) => T[] }): T[] {
    if (typeof random.Die === 'function') {
        const result = [...arr];
        for (let i = result.length - 1; i >= 1; i--) {
            const j = random.Die!(i + 1) - 1; // 0..i inclusive
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    // Fallback if Die not available (boardgame.io API may vary)
    return random.Shuffle ? random.Shuffle([...arr]) : arr;
}

/** CORE-01-03-02B: Canonical Pre-Shuffle Ordering. */
function sortDrawPileCanonical(G: GameState): string[] {
    const items = G.zones[CoreZoneNames.DrawPile]?.items ?? [];
    const TILE_TYPE_ORDER: Record<string, number> = {
        [TileType.Resort]: 0,
        [TileType.Committee]: 1,
        [TileType.Grassroots]: 2,
        [TileType.Lobbyist]: 3,
        [TileType.Hotspot]: 4
    };
    const RESORT_ORDER: Record<string, number> = {
        [CoreResources.DOM]: 0,
        [CoreResources.FOR]: 1,
        [CoreResources.INF]: 2
    };

    return [...items].sort((aId, bId) => {
        const a = G.tiles[aId];
        const b = G.tiles[bId];
        if (!a || !b) return 0;

        const typeA = TILE_TYPE_ORDER[a.type] ?? 99;
        const typeB = TILE_TYPE_ORDER[b.type] ?? 99;
        if (typeA !== typeB) return typeA - typeB;

        // CORE-01-03-02B.1: Typed Grassroots use resort; Untyped use None
        const resortA = a.resort ?? a.conversion?.typedResort ?? null;
        const resortB = b.resort ?? b.conversion?.typedResort ?? null;
        const orderA = resortA ? (RESORT_ORDER[resortA] ?? 3) : 4;
        const orderB = resortB ? (RESORT_ORDER[resortB] ?? 3) : 4;
        if (orderA !== orderB) return orderA - orderB;

        const wA = a.weight ?? 99;
        const wB = b.weight ?? 99;
        if (wA !== wB) return wA - wB;

        return aId.localeCompare(bId);
    });
}
