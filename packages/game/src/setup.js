"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupGame = void 0;
const rules_1 = require("@balance-control/rules");
const expansion_registry_1 = require("./expansion-registry");
const SetupGame = ({ ctx }) => {
    const G = {
        zones: {},
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
    };
    // 1. Initialize Zones
    const globalZones = [
        rules_1.CoreZoneNames.DrawPile,
        rules_1.CoreZoneNames.DiscardFaceUp,
        rules_1.CoreZoneNames.Board,
        rules_1.CoreZoneNames.Bank,
        rules_1.CoreZoneNames.Noise
    ];
    globalZones.forEach(z => {
        G.zones[z] = { id: z, name: z, items: [] };
    });
    // Personal Zones
    for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        const zoneId = `${rules_1.CoreZoneNames.PersonalSupply}:${pid}`;
        G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };
        // CORE-01-03-04/05/06: Influence Assignment
        let influenceCount = 0;
        if (ctx.numPlayers === 2)
            influenceCount = 4;
        else if (ctx.numPlayers === 3)
            influenceCount = 3;
        else if (ctx.numPlayers === 4)
            influenceCount = 2;
        // ADD56-01-02-01/02: 5-6 players get 2 Influence each
        else if (ctx.numPlayers === 5 || ctx.numPlayers === 6)
            influenceCount = 2;
        for (let k = 0; k < influenceCount; k++) {
            const infId = `inf_${pid}_${k}`;
            const inf = { id: infId, type: 'Influence', owner: pid, isStarting: true };
            G.objects[infId] = inf;
            G.zones[zoneId].items.push(infId);
        }
    }
    // 2. Initialize Tiles
    const startId = 'tile_start_committee';
    G.tiles[startId] = { id: startId, type: rules_1.TileType.StartCommittee };
    G.zones[rules_1.CoreZoneNames.Board].items.push(startId);
    // Also create a "zone" for the tile itself?
    // Our mechanics assume G.zones[tileId] exists for placement.
    G.zones[startId] = { id: startId, name: 'Start Committee', items: [] };
    // Fix B: Start Committee needs a grid coordinate for adjacency checks
    G.grid['0,0'] = startId;
    // 3. Initialize DrawPile
    const coreTiles = generateCoreTiles();
    coreTiles.forEach(t => {
        G.tiles[t.id] = t;
        G.zones[rules_1.CoreZoneNames.DrawPile].items.push(t.id);
        // Create context zone for every tile to handle items on it
        G.zones[t.id] = { id: t.id, name: t.name || t.id, items: [] };
    });
    // Shuffle DrawPile 
    // basic Fisher-Yates if ctx.random is available
    // Cast to any because boardgame.io Ctx type definition might be missing random in some versions
    const _ctx = ctx;
    if (_ctx && _ctx.random) {
        G.zones[rules_1.CoreZoneNames.DrawPile].items = _ctx.random.Shuffle(G.zones[rules_1.CoreZoneNames.DrawPile].items);
    }
    // 4. Apply Expansions
    expansion_registry_1.ExpansionRegistry.applySetup(G, ctx);
    // Re-shuffle if Expansions added to DrawPile?
    // Rules say "Setup shuffles all non-Start tiles into DrawPile", essentially implying one big shuffle at end of setup or before game start.
    // We'll trust ExpansionRegistry to add to DrawPile, then we might want to shuffle again or ensure expansions inject before shuffle.
    // For now, let's assume expansions might add their own, so maybe shuffle should be last?
    // But API says applySetup(G). G is fully mutable.
    // Let's do a final shuffle after expansion setup to be safe and fair.
    if (ctx && ctx.random) {
        G.zones[rules_1.CoreZoneNames.DrawPile].items = ctx.random.Shuffle(G.zones[rules_1.CoreZoneNames.DrawPile].items);
    }
    return G;
};
exports.SetupGame = SetupGame;
// CORE-01-02-10 to CORE-01-02-16
function generateCoreTiles() {
    const tiles = [];
    let idCounter = 1;
    const add = (type, count, props = {}) => {
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
    [rules_1.CoreResources.DOM, rules_1.CoreResources.FOR, rules_1.CoreResources.INF].forEach(res => {
        add(rules_1.TileType.Resort, 2, { resort: res, weight: 1 });
        add(rules_1.TileType.Resort, 4, { resort: res, weight: 2 });
        add(rules_1.TileType.Resort, 4, { resort: res, weight: 3 });
        add(rules_1.TileType.Resort, 1, { resort: res, weight: 4 });
        add(rules_1.TileType.Resort, 1, { resort: res, weight: 5 });
    });
    // Committees x10
    add(rules_1.TileType.Committee, 10);
    // Grassroots x8
    add(rules_1.TileType.Grassroots, 8);
    // Lobbyists x9
    add(rules_1.TileType.Lobbyist, 9);
    // Hotspots x8
    add(rules_1.TileType.Hotspot, 8);
    return tiles;
}
//# sourceMappingURL=setup.js.map