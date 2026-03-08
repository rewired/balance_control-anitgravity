import { GameState, CoreZoneName, TileType, RULESET_MANIFEST, RulesetManifest, GameMeta } from '@balance-control/rules';
import { Ctx } from 'boardgame.io';
import { normalizeGameConfig } from './config';
import { hashState } from './hash-state';
import { assemblePacks } from './move-assembly';
import { ensureCorePackRegistered } from './packs/register-core';
import { getPublicSurface } from './surface';
import { updateGlobalStats } from './state-lookup';

/**
 * Normalizes boardgame.io context to ensure RNG is available.
 * @remarks infrastructure; no direct SPEC binding
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @pure
 */
function normalizeBoardgameCtx(ctx: any): Ctx {
    if (ctx && typeof ctx === 'object' && (ctx as any).ctx && typeof (ctx as any).ctx === 'object') {
        const inner = (ctx as any).ctx as Ctx;
        const random = (ctx as any).random ?? (inner as any).random;
        return { ...(inner as any), random } as any;
    }
    return ctx as Ctx;
}

/**
 * Resolves the effective boardgame.io match seed from setup context.
 * @remarks infrastructure; no direct SPEC binding
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @pure
 */
function resolveEngineSeed(ctx: any): string | undefined {
    const directSeedCandidates = [
        ctx?.randomSeed,
        ctx?._randomSeed,
        ctx?.ctx?.randomSeed,
        ctx?.ctx?._randomSeed,
    ];

    for (const candidate of directSeedCandidates) {
        if (typeof candidate === 'string' || typeof candidate === 'number') {
            return String(candidate);
        }
    }

    const randomSource = ctx?.random ?? ctx?.ctx?.random;
    const seedCandidate = randomSource?._private?.state?.seed;
    if (typeof seedCandidate === 'string' || typeof seedCandidate === 'number') {
        return String(seedCandidate);
    }
    return undefined;
}

/**
 * Main entry point for initializing the Balance Control game state.
 * @rule CORE-01-03-01
 * @rule CORE-01-00-09
 * @usesRNG
 * @rule CORE-01-03-02A
 * @deterministic
 * @sideEffects
 */
export const SetupGame = ({ ctx, setupData }: { ctx: Ctx, setupData?: unknown }): GameState => {
    const normalizedCtx = normalizeBoardgameCtx(ctx);
    const effectiveSeed = resolveEngineSeed(normalizedCtx);

    const gameConfig = normalizeGameConfig(setupData);
    const rulesetBase: RulesetManifest = RULESET_MANIFEST;
    const rulesetExpansions: RulesetManifest['expansions'] = {};
    const enabledPacks = gameConfig.packs?.enabledPacks ?? [];

    if (enabledPacks.includes('exp01')) {
        rulesetExpansions.exp01Version = rulesetBase.expansions.exp01Version;
    }
    if (enabledPacks.includes('exp02')) {
        rulesetExpansions.exp02Version = rulesetBase.expansions.exp02Version;
    }
    if (enabledPacks.includes('exp03')) {
        rulesetExpansions.exp03Version = rulesetBase.expansions.exp03Version;
    }
    const rulesetManifest: RulesetManifest = {
        coreVersion: rulesetBase.coreVersion,
        expansions: rulesetExpansions,
        specAnchorHash: rulesetBase.specAnchorHash,
    };

    const G: GameState & { meta: GameMeta } = {
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
                seed: effectiveSeed,
                enabledExpansions: {
                    ex01: enabledPacks.includes('exp01'),
                    ex02: enabledPacks.includes('exp02'),
                    ex03: enabledPacks.includes('exp03'),
                }
            }
        },
    };

    ensureCorePackRegistered();

    const publicSurface = getPublicSurface(gameConfig);
    const publicSurfaceHash = hashState(publicSurface);
    G.meta.enabledPacks = publicSurface.packs;
    G.meta.publicSurfaceHash = publicSurfaceHash;

    const packAssembly = assemblePacks({ config: gameConfig, mode: 'enabled' });
    packAssembly.applySetupPreShuffle(G, normalizedCtx);

    // CORE-01-03-02B: Canonical Pre-Shuffle Ordering before shuffle
    if (G.zones[CoreZoneName.DrawPile]) {
        G.zones[CoreZoneName.DrawPile].items = sortDrawPileCanonical(G);
    }

    // CORE-01-03-02 / CORE-01-03-02A.1: Canonical Fisher-Yates shuffle (i from n-1 down to 1, j = RNG.nextInt(i+1))
    if (normalizedCtx && (normalizedCtx as any).random && G.zones[CoreZoneName.DrawPile]) {
        G.zones[CoreZoneName.DrawPile].items = shuffleFisherYates(
            G.zones[CoreZoneName.DrawPile].items,
            (normalizedCtx as any).random
        );
    }

    // CORE-01-03-02 / CORE-01-03-02A.2: Determine starting player (canonical RNG call)
    if ((normalizedCtx as any)?.random?.Die) {
        const seatCount = Math.max(1, normalizedCtx.numPlayers ?? 1);
        const k = (normalizedCtx as any).random.Die(seatCount) - 1; // 0..numPlayers-1
        G.engine.attributes.startingPlayerIndex = k;
    }

    packAssembly.applySetupPostShuffle(G, normalizedCtx);

    // Initial stats computation
    updateGlobalStats(G, normalizedCtx);

    return G;
};

/**
 * CORE-01-03-02A.1: Fisher-Yates shuffle; j = RNG.nextInt(i+1). Uses ctx.random for determinism.
 * @usesRNG
 * @rule CORE-01-03-02A
 * @rule CORE-01-03-02A.1A
 */
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
    const items = G.zones[CoreZoneName.DrawPile]?.items ?? [];
    // Capture original indices for stable tie-breaking (SerialIndex)
    const indexById = new Map<string, number>();
    items.forEach((id, index) => indexById.set(id, index));

    const TILE_TYPE_ORDER: Record<string, number> = {
        [TileType.Resort]: 0,
        [TileType.Committee]: 1,
        [TileType.Grassroots]: 2,
        [TileType.Lobbyist]: 3,
        [TileType.Hotspot]: 4
    };
    const RESORT_ORDER: Record<string, number> = {
        'DOM': 0,
        'FOR': 1,
        'INF': 2
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

        // CORE-01-03-02B: Final tie-break: SerialIndex (original generation order)
        // Replaces lexicographic ID comparison for improved canonical stability
        return (indexById.get(aId)! - indexById.get(bId)!);
    });
}
