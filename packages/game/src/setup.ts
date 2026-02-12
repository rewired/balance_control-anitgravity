import { GameState, CoreZoneNames, Tile, TileType, CoreResources, GameObject, Zone } from '@balance-control/rules';
import { Ctx } from 'boardgame.io';
import { ExpansionRegistry } from './expansion-registry';
import { normalizeGameConfig } from './config';

export const SetupGame = ({ ctx, setupData }: { ctx: Ctx, setupData?: unknown }): GameState => {
    const gameConfig = normalizeGameConfig(setupData);

    const G: GameState = {
        zones: {},
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
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

    // Personal Zones
    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
        G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };

        // CORE-01-03-04/05/06: Influence Assignment
        let influenceCount = 0;
        if (ctx.numPlayers === 2) influenceCount = 4;
        else if (ctx.numPlayers === 3) influenceCount = 3;
        else if (ctx.numPlayers === 4) influenceCount = 2;
        // ADD56-01-02-01/02: 5-6 players get 2 Influence each
        else if (ctx.numPlayers === 5 || ctx.numPlayers === 6) influenceCount = 2;

        for (let k = 0; k < influenceCount; k++) {
            const infId = `inf_${pid}_${k}`;
            const inf: GameObject = { id: infId, type: 'Influence', owner: pid, isStarting: true };
            G.objects[infId] = inf;
            G.zones[zoneId].items.push(infId);
        }
    }

    // 2. Initialize Tiles
    const startId = 'tile_start_committee';
    G.tiles[startId] = { id: startId, type: TileType.StartCommittee };
    G.zones[CoreZoneNames.Board].items.push(startId);
    // Also create a "zone" for the tile itself?
    // Our mechanics assume G.zones[tileId] exists for placement.
    G.zones[startId] = { id: startId, name: 'Start Committee', items: [] };
    // Fix B: Start Committee needs a grid coordinate for adjacency checks
    G.grid['0,0'] = startId;

    // 3. Initialize DrawPile
    const coreTiles = generateCoreTiles();
    coreTiles.forEach(t => {
        G.tiles[t.id] = t;
        G.zones[CoreZoneNames.DrawPile].items.push(t.id);
        // Create context zone for every tile to handle items on it
        G.zones[t.id] = { id: t.id, name: t.name || t.id, items: [] };
    });

    // 4. Apply enabled expansions before the one final setup shuffle.
    ExpansionRegistry.applySetup(G, ctx, gameConfig);

    // CORE-01-03-02: Shuffle all non-Start tiles after composition is finalized.
    if (ctx && (ctx as any).random) {
        G.zones[CoreZoneNames.DrawPile].items = (ctx as any).random.Shuffle(G.zones[CoreZoneNames.DrawPile].items);
    }

    return G;
};

// CORE-01-02-10 to CORE-01-02-16
function generateCoreTiles(): Tile[] {
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

    // Grassroots x8
    add(TileType.Grassroots, 8);

    // Lobbyists x9
    add(TileType.Lobbyist, 9);

    // Hotspots x8
    add(TileType.Hotspot, 8);

    return tiles;
}
