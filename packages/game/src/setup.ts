import { GameState, CoreZoneNames, Tile, TileType, CoreResources, GameObject, Zone, RULESET_MANIFEST, RulesetManifest } from '@balance-control/rules';
import { positionKeyFromCoordString } from './topology';
import { Ctx } from 'boardgame.io';
import { ExpansionRegistry } from './expansion-registry';
import { normalizeGameConfig } from './config';

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

    // 1. Initialize Zones
    const globalZones = [
        CoreZoneNames.DrawPile,
        CoreZoneNames.DiscardFaceUp,
        CoreZoneNames.Board,
        CoreZoneNames.Bank,
        CoreZoneNames.Noise
    ];

    globalZones.forEach(z => {
        G.zones[z] = { id: z, name: z, items: [] };
    });

    // Personal Zones (Meta-Marker only; CORE-01-03-03B: Influence after Shuffle)
    for (let i = 0; i < normalizedCtx.numPlayers; i++) {
        const pid = i.toString();
        const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };

        const metaId = `meta_${pid}`;
        const meta: GameObject = { id: metaId, type: 'MetaMarker', owner: pid };
        G.objects[metaId] = meta;
        G.zones[zoneId].items.push(metaId);
    }

    // 2. Initialize Tiles (Start Committee)
    const startId = 'tile_start_committee';
    G.tiles[startId] = { id: startId, type: TileType.StartCommittee };
    G.zones[CoreZoneNames.Board].items.push(startId);
    // Also create a "zone" for the tile itself?
    // Our mechanics assume G.zones[tileId] exists for placement.
    G.zones[startId] = { id: startId, name: 'Start Committee', items: [] };
    // Fix B: Start Committee needs a grid coordinate for adjacency checks
    G.grid['0,0'] = startId;

    // 3. Initialize DrawPile (core + ADD56 when 5-6 players)
    const coreTiles = generateCoreTiles(normalizedCtx.numPlayers);
    coreTiles.forEach(t => {
        G.tiles[t.id] = t;
        G.zones[CoreZoneNames.DrawPile].items.push(t.id);
        // Create context zone for every tile to handle items on it
        G.zones[t.id] = { id: t.id, name: t.name || t.id, items: [] };
    });

    // 4. Apply enabled expansions before the one final setup shuffle.
    ExpansionRegistry.applySetup(G, normalizedCtx, gameConfig);

    // CORE-01-03-02B: Canonical Pre-Shuffle Ordering before shuffle
    G.zones[CoreZoneNames.DrawPile].items = sortDrawPileCanonical(G);

    // CORE-01-03-02 / CORE-01-03-02A.1: Canonical Fisher-Yates shuffle (i from n-1 down to 1, j = RNG.nextInt(i+1))
    if (normalizedCtx && (normalizedCtx as any).random) {
        G.zones[CoreZoneNames.DrawPile].items = shuffleFisherYates(
            G.zones[CoreZoneNames.DrawPile].items,
            (normalizedCtx as any).random
        );
    }

    // CORE-01-03-03B(5): Assign Starting Influence after Shuffle
    for (let i = 0; i < normalizedCtx.numPlayers; i++) {
        const pid = i.toString();
        const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        let influenceCount = 0;
        if (normalizedCtx.numPlayers === 2) influenceCount = 4;
        else if (normalizedCtx.numPlayers === 3) influenceCount = 3;
        else if (normalizedCtx.numPlayers === 4) influenceCount = 2;
        // ADD56-01-02-01/02: 5-6 players get 2 Influence each
        else if (normalizedCtx.numPlayers === 5 || normalizedCtx.numPlayers === 6) influenceCount = 2;

        for (let k = 0; k < influenceCount; k++) {
            const infId = `inf_${pid}_${k}`;
            const inf: GameObject = { id: infId, type: 'Influence', owner: pid, isStarting: true };
            G.objects[infId] = inf;
            G.zones[zoneId].items.push(infId);
        }
    }

    return G;
};

// CORE-01-02-10 to CORE-01-02-16
function generateCoreTiles(numPlayers: number): Tile[] {
    const tiles: Tile[] = [];
    let idCounter = 1;

    const add = (type: TileType, count: number, props: Partial<Tile> = {}) => {
        for (let i = 0; i < count; i++) {
            tiles.push({
                id: `tile_core_${idCounter++}`,
                type,
                name: `${type} ${i + 1}`,
                ...props
            });
        }
    };

    // Resorts (DOM, FOR, INF)
    // W1x2, W2x4, W3x4, W4x1, W5x1 = 12 each
    [CoreResources.DOM, CoreResources.FOR, CoreResources.INF].forEach(res => {
        add(TileType.Resort, 2, { resort: res, weight: 1 });
        add(TileType.Resort, 4, { resort: res, weight: 2 });
        add(TileType.Resort, 4, { resort: res, weight: 3 });
        add(TileType.Resort, 1, { resort: res, weight: 4 });
        add(TileType.Resort, 1, { resort: res, weight: 5 });
    });

    // Committees x10
    add(TileType.Committee, 10);

    // CORE-01-02-14A: Grassroots — Untyped ×2, Typed(DOM) ×2, Typed(FOR) ×2, Typed(INF) ×2
    add(TileType.Grassroots, 2, {
        conversion: { inputSlots: 3, outputSlots: 1 }
    }); // Untyped: CORE-01-04-22K
    [CoreResources.DOM, CoreResources.FOR, CoreResources.INF].forEach(res => {
        add(TileType.Grassroots, 2, {
            resort: res,
            conversion: { inputSlots: 2, outputSlots: 1, typedResort: res }
        }); // Typed: CORE-01-04-22L
    });

    // Lobbyists x9
    add(TileType.Lobbyist, 9);

    // Hotspots x8
    add(TileType.Hotspot, 8);

    // ADD56-01-01-02 to 01-16: 5-6 Player Add-On tiles
    if (numPlayers >= 5) {
        // DOM-W2 ×1, DOM-W3 ×1, DOM-W4 ×1 (ADD56-01-01-02/03/04)
        add(TileType.Resort, 1, { resort: CoreResources.DOM, weight: 2 });
        add(TileType.Resort, 1, { resort: CoreResources.DOM, weight: 3 });
        add(TileType.Resort, 1, { resort: CoreResources.DOM, weight: 4 });
        // FOR-W2/3/4 (ADD56-01-01-05/06/07)
        add(TileType.Resort, 1, { resort: CoreResources.FOR, weight: 2 });
        add(TileType.Resort, 1, { resort: CoreResources.FOR, weight: 3 });
        add(TileType.Resort, 1, { resort: CoreResources.FOR, weight: 4 });
        // INF-W2/3/4 (ADD56-01-01-08/09/10)
        add(TileType.Resort, 1, { resort: CoreResources.INF, weight: 2 });
        add(TileType.Resort, 1, { resort: CoreResources.INF, weight: 3 });
        add(TileType.Resort, 1, { resort: CoreResources.INF, weight: 4 });
        // Committee ×2 (ADD56-01-01-11)
        add(TileType.Committee, 2);
        // Lobbyist ×3 (ADD56-01-01-12)
        add(TileType.Lobbyist, 3);
        // Grassroots Untyped ×2 (ADD56-01-01-13, 01-13A)
        add(TileType.Grassroots, 2, { conversion: { inputSlots: 3, outputSlots: 1 } });
        // Hotspot (DOM) ×1, Hotspot (FOR) ×1 (ADD56-01-01-14/15/16)
        add(TileType.Hotspot, 1);
        add(TileType.Hotspot, 1);
    }

    return tiles;
}

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
