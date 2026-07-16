import { CoreZoneName, RULESET_MANIFEST, TileType, type GameConfig, type GameObject, type GameState, type Tile } from '@balance-control/rules';
import type { EnginePackDefinition, PackManifest } from '../types';
import { generateCoreTiles } from './tile-loader';
import { coreRootTurn, coreEndIf, buildCorePlayerView } from './root-pack';
import {
    CoreMoves,
    coreResourceAtoms,
    coreInfluenceAtoms,
    coreProductionAtoms,
    coreMeasureAtoms,
    coreChoiceAtoms,
    coreHotspotAtoms,
    createCoreRulesAtoms
} from '../pack-api';

const START_COMMITTEE_TILE_ID = 'tile_start_committee';
const CORE_PACK_VERSION = RULESET_MANIFEST.coreVersion.replace(/^v/i, '');
const CORE_PACK_MANIFEST: PackManifest = {
    id: 'core',
    packVersion: CORE_PACK_VERSION,
    rulesetAnchor: `CORE-01-00 ${RULESET_MANIFEST.coreVersion}`,
    required: true,
};

/**
 * Core engine pack implementing CORE-01-00 ruleset.
 * @rule CORE-01-00
 * @deterministic
 * @pure
 */
export const CorePack: EnginePackDefinition = {
    id: 'core',
    name: 'CORE-01-00 (v1.1.0)',
    manifest: CORE_PACK_MANIFEST,
    moves: CoreMoves,
    setup: {
        /**
         * @rule CORE-01-00-02A
         * @rule CORE-01-00-03A
         * @rule CORE-01-00-T09
         * @rule CORE-01-00-T06
         * @rule CORE-01-02-01
         * @rule CORE-01-02-02
         * @rule CORE-01-02-17A
         * @rule CORE-01-02-17E
         */
        preShuffle: (G: GameState, ctx: any, _cfg: GameConfig) => {
            // 1. Initialize Zones
            const globalZones = [CoreZoneName.DrawPile, CoreZoneName.DiscardFaceUp, CoreZoneName.Board, CoreZoneName.Bank, CoreZoneName.Noise];

            for (const zoneId of globalZones) {
                G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };
            }

            // Personal Zones (Meta-Marker only; CORE-01-03-03B: Influence after Shuffle)
            for (let i = 0; i < ctx.numPlayers; i++) {
                const pid = i.toString();
                const zoneId = `${CoreZoneName.PersonalSupply}:${pid}`;
                G.zones[zoneId] = { id: zoneId, name: zoneId, items: [] };

                const metaId = `meta_${pid}`;
                const meta: GameObject = { id: metaId, type: 'MetaMarker', owner: pid };
                G.objects[metaId] = meta;
                G.zones[zoneId].items.push(metaId);
            }

            // 2. Initialize Tiles (Start Committee)
            G.tiles[START_COMMITTEE_TILE_ID] = { id: START_COMMITTEE_TILE_ID, type: TileType.StartCommittee };
            G.zones[CoreZoneName.Board].items.push(START_COMMITTEE_TILE_ID);
            // Our mechanics assume G.zones[tileId] exists for placement.
            G.zones[START_COMMITTEE_TILE_ID] = { id: START_COMMITTEE_TILE_ID, name: 'Start Committee', items: [] };
            // Fix B: Start Committee needs a grid coordinate for adjacency checks
            G.grid['0,0'] = START_COMMITTEE_TILE_ID;

            // 3. Initialize DrawPile (core + ADD56 when 5-6 players)
            const coreTiles = generateCoreTiles(ctx.numPlayers);
            for (const tile of coreTiles) {
                G.tiles[tile.id] = tile;
                G.zones[CoreZoneName.DrawPile].items.push(tile.id);
                // Create context zone for every tile to handle items on it
                G.zones[tile.id] = { id: tile.id, name: tile.name || tile.id, items: [] };
            }
        },
        /**
         * @rule CORE-01-03-04
         * @rule CORE-01-03-05
         * @rule CORE-01-03-06
         */
        postShuffle: (G: GameState, ctx: any, cfg: GameConfig) => {
            // CORE-01-03-03B(5): Assign Starting Influence after Shuffle
            for (let i = 0; i < ctx.numPlayers; i++) {
                const pid = i.toString();
                const zoneId = `${CoreZoneName.PersonalSupply}:${pid}`;
                let influenceCount = 0;
                if (ctx.numPlayers === 2) influenceCount = 4;
                else if (ctx.numPlayers === 3) influenceCount = 3;
                else if (ctx.numPlayers === 4) influenceCount = 2;
                // ADD56-01-02-01/02: 5-6 players get 2 Influence each
                else if (ctx.numPlayers === 5 || ctx.numPlayers === 6) influenceCount = 2;

                // CORE-01-03-02 / VAR-01-02-02: Apply FirstPlayerHandicap to starting player
                const startingPlayerIndex = G.engine.attributes.startingPlayerIndex ?? 0;
                if (cfg.firstPlayerHandicap && pid === String(startingPlayerIndex)) {
                    influenceCount = Math.max(0, influenceCount - 1);
                }

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
    turn: coreRootTurn,
    endIf: coreEndIf,
    playerView: buildCorePlayerView,
};
