import { CoreResources, CoreZoneNames, RULESET_MANIFEST, TileType, type GameConfig, type GameObject, type GameState, type Tile } from '@balance-control/rules';
import type { EnginePackDefinition, PackManifest } from '../types';
import { CoreMoves } from '../../moves';
import { coreResourceAtoms } from '../../engine/atoms/resource';
import { coreInfluenceAtoms } from '../../engine/atoms/influence';
import { coreProductionAtoms } from '../../engine/atoms/production';
import { coreMeasureAtoms } from '../../engine/atoms/measure';
import { coreChoiceAtoms } from '../../engine/atoms/choice';
import { coreHotspotAtoms } from '../../engine/atoms/hotspot';
import { createCoreRulesAtoms } from '../../engine/atoms/rules';

const START_COMMITTEE_TILE_ID = 'tile_start_committee';
const CORE_PACK_VERSION = RULESET_MANIFEST.coreVersion.replace(/^v/i, '');
const CORE_PACK_MANIFEST: PackManifest = {
    id: 'core',
    packVersion: CORE_PACK_VERSION,
    rulesetAnchor: `CORE-01 ${RULESET_MANIFEST.coreVersion}`,
    required: true,
};

export const CorePack: EnginePackDefinition = {
    id: 'core',
    name: 'CORE-01 (v1.1.0)',
    manifest: CORE_PACK_MANIFEST,
    moves: CoreMoves,
    setup: {
        preShuffle: (G: GameState, ctx: any, _cfg: GameConfig) => {
            // 1. Initialize Zones
            const globalZones = [CoreZoneNames.DrawPile, CoreZoneNames.DiscardFaceUp, CoreZoneNames.Board, CoreZoneNames.Bank, CoreZoneNames.Noise];

            for (const zoneId of globalZones) {
                G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };
            }

            // Personal Zones (Meta-Marker only; CORE-01-03-03B: Influence after Shuffle)
            for (let i = 0; i < ctx.numPlayers; i++) {
                const pid = i.toString();
                const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
                G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };

                const metaId = `meta_${pid}`;
                const meta: GameObject = { id: metaId, type: 'MetaMarker', owner: pid };
                G.objects[metaId] = meta;
                G.zones[zoneId].items.push(metaId);
            }

            // 2. Initialize Tiles (Start Committee)
            G.tiles[START_COMMITTEE_TILE_ID] = { id: START_COMMITTEE_TILE_ID, type: TileType.StartCommittee };
            G.zones[CoreZoneNames.Board].items.push(START_COMMITTEE_TILE_ID);
            // Our mechanics assume G.zones[tileId] exists for placement.
            G.zones[START_COMMITTEE_TILE_ID] = { id: START_COMMITTEE_TILE_ID, name: 'Start Committee', items: [] };
            // Fix B: Start Committee needs a grid coordinate for adjacency checks
            G.grid['0,0'] = START_COMMITTEE_TILE_ID;

            // 3. Initialize DrawPile (core + ADD56 when 5-6 players)
            const coreTiles = generateCoreTiles(ctx.numPlayers);
            for (const tile of coreTiles) {
                G.tiles[tile.id] = tile;
                G.zones[CoreZoneNames.DrawPile].items.push(tile.id);
                // Create context zone for every tile to handle items on it
                G.zones[tile.id] = { id: tile.id, name: tile.name || tile.id, items: [] };
            }
        },
        postShuffle: (G: GameState, ctx: any, _cfg: GameConfig) => {
            // CORE-01-03-03B(5): Assign Starting Influence after Shuffle
            for (let i = 0; i < ctx.numPlayers; i++) {
                const pid = i.toString();
                const zoneId = `${CoreZoneNames.PersonalSupply}:${pid}`;
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
        },
    },
    engine: {
        atoms: ({ triggerHook }) => {
            return [
                ...coreResourceAtoms,
                ...coreProductionAtoms,
                ...coreMeasureAtoms,
                ...coreInfluenceAtoms,
                ...coreChoiceAtoms,
                ...createCoreRulesAtoms({ triggerHook }),
                ...coreHotspotAtoms,
            ];
        },
    },
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
                ...props,
            });
        }
    };

    // Resorts (DOM, FOR, INF)
    // W1x2, W2x4, W3x4, W4x1, W5x1 = 12 each
    [CoreResources.DOM, CoreResources.FOR, CoreResources.INF].forEach((res) => {
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
        conversion: { inputSlots: 3, outputSlots: 1 },
    }); // Untyped: CORE-01-04-22K
    [CoreResources.DOM, CoreResources.FOR, CoreResources.INF].forEach((res) => {
        add(TileType.Grassroots, 2, {
            resort: res,
            conversion: { inputSlots: 2, outputSlots: 1, typedResort: res },
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
