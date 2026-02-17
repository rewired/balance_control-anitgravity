import { beforeEach, describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Game } from 'boardgame.io';
import { CoreMoves } from '../src/moves';
import { TileType, CoreZoneNames, GameState } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

/**
 * Self-contained game definition for hotspot testing.
 * We build the setup entirely here so we control the board topology.
 */
function makeHotspotTestGame(): Game {
    return {
        name: 'hotspot-test',
        setup: (): GameState => {
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
                        limits: {},
                        usage: {},
                        prohibitions: {},
                        tileExtraCosts: {},
                        playerExtraCosts: {},
                        climateCostRules: [],
                    }
                }
            };

            // Board zone
            G.zones[CoreZoneNames.Board] = { id: CoreZoneNames.Board, name: 'Board', items: [] };
            G.zones[CoreZoneNames.Bank] = { id: CoreZoneNames.Bank, name: 'Bank', items: [] };
            G.zones[CoreZoneNames.Noise] = { id: CoreZoneNames.Noise, name: 'Noise', items: [] };
            G.zones[CoreZoneNames.DrawPile] = { id: CoreZoneNames.DrawPile, name: 'DrawPile', items: [] };

            // Player zones
            for (let i = 0; i < 2; i++) {
                const pid = String(i);
                const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
                G.zones[supplyId] = { id: supplyId, name: supplyId, items: [] };
                const stagingId = `staging_${pid}`;
                G.zones[stagingId] = { id: stagingId, name: stagingId, items: [] };
            }

            // Center tile at 0,0 (a Resort, not StartCommittee, so hotspot can resolve)
            const centerId = 'tile_center';
            G.tiles[centerId] = { id: centerId, type: TileType.Resort, weight: 1, resort: 'DOM' };
            G.zones[CoreZoneNames.Board].items.push(centerId);
            G.grid['0,0'] = centerId;
            G.adjacency[centerId] = [];
            // Create a zone for this tile (to hold influence)
            G.zones[centerId] = { id: centerId, name: 'Center', items: [] };

            // Place 1 Influence for Player 0 on center tile (to have majority)
            const infOnTile = 'inf_p0_on_center';
            G.objects[infOnTile] = { id: infOnTile, type: 'Influence', owner: '0' };
            G.zones[centerId].items.push(infOnTile);

            // Place 1 Influence in Player 0's supply (to be pulled during resolution)
            const infInSupply = 'inf_p0_supply';
            G.objects[infInSupply] = { id: infInSupply, type: 'Influence', owner: '0' };
            G.zones[`${CoreZoneNames.PersonalSupply}:0`].items.push(infInSupply);

            // Place 5 of 6 neighbors around 0,0
            const prefillCoords = ['1,0', '1,-1', '0,-1', '-1,0', '-1,1'];
            prefillCoords.forEach((coord, i) => {
                const tid = `tile_n${i}`;
                G.tiles[tid] = { id: tid, type: TileType.Resort, weight: 1, resort: 'DOM' };
                G.zones[CoreZoneNames.Board].items.push(tid);
                G.grid[coord] = tid;
                G.adjacency[tid] = [centerId];
                G.adjacency[centerId].push(tid);
            });

            // The 6th neighbor (0,1) is EMPTY — Player 0 will place here to trigger.
            // Put a tile in Player 0's staging
            const triggerTile = 'tile_trigger';
            G.tiles[triggerTile] = { id: triggerTile, type: TileType.Resort, weight: 1, resort: 'FOR' };
            G.zones['staging_0'].items.push(triggerTile);

            return G;
        },
        moves: CoreMoves,
        turn: {
            activePlayers: { currentPlayer: 'drawAndPlace' },
            stages: {
                drawAndPlace: {
                    moves: { placeTile: CoreMoves.placeTile },
                    next: 'politicalAction',
                },
                politicalAction: {
                    moves: {},
                },
            },
        },
    };
}

describe('Hotspot Mechanics', () => {
    beforeEach(() => {
        registerTestPacks();
    });
    it('should detect hotspot when a tile becomes fully surrounded', () => {
        const game = makeHotspotTestGame();
        const client = Client({ game, numPlayers: 2 });
        client.start();

        const state0 = client.getState()!;
        // Verify initial state: 5 neighbors placed, center has 1 influence
        expect(Object.keys(state0.G.grid).length).toBe(6); // center + 5 neighbors
        expect(state0.G.zones['tile_center'].items.length).toBe(1); // 1 influence

        // Player 0 places the 6th tile at 0,1
        client.moves.placeTile({ targetCoord: '0,1' });

        const state1 = client.getState()!;

        // Center should now be fully surrounded (all 6 neighbors occupied)
        expect(Object.keys(state1.G.grid).length).toBe(7); // center + 6

        // Hotspot resolution should have fired:
        // - computeMajority(tile_center): Player 0 has 1 influence → controller = '0'
        // - 1 Influence moved from PersonalSupply:0 to tile_center zone
        const centerZone = state1.G.zones['tile_center'];
        const infCount = centerZone.items.filter(
            (id: string) => state1.G.objects[id]?.type === 'Influence'
        ).length;
        expect(infCount).toBe(2); // original 1 + hotspot reward 1

        // Supply should be empty now
        const supply = state1.G.zones[`${CoreZoneNames.PersonalSupply}:0`];
        const supplyInf = supply.items.filter(
            (id: string) => state1.G.objects[id]?.type === 'Influence'
        ).length;
        expect(supplyInf).toBe(0);
    });

    it('should NOT trigger hotspot if center is not fully surrounded', () => {
        const game = makeHotspotTestGame();
        // Remove one pre-filled neighbor so only 4 are placed
        const origSetup = game.setup as any;
        game.setup = (...args: any[]) => {
            const G = origSetup(...args);
            // Remove tile_n4 at -1,1
            delete G.grid['-1,1'];
            const idx = G.zones[CoreZoneNames.Board].items.indexOf('tile_n4');
            if (idx >= 0) G.zones[CoreZoneNames.Board].items.splice(idx, 1);
            delete G.tiles['tile_n4'];
            G.adjacency['tile_center'] = G.adjacency['tile_center'].filter(
                (id: string) => id !== 'tile_n4'
            );
            return G;
        };

        const client = Client({ game, numPlayers: 2 });
        client.start();

        // Place at 0,1 — but only 5 of 6 neighbors filled (missing -1,1)
        client.moves.placeTile({ targetCoord: '0,1' });

        const state = client.getState()!;
        // Center should NOT have extra influence (still 4 empty neighbors → not surrounded)
        // Wait: we still have 4 pre-fills + the one we placed = 5. Missing -1,1. So 5 of 6.
        const centerZone = state.G.zones['tile_center'];
        const infCount = centerZone.items.filter(
            (id: string) => state.G.objects[id]?.type === 'Influence'
        ).length;
        expect(infCount).toBe(1); // no hotspot, still just the original
    });

    it('should not place influence if majority player has empty supply', () => {
        const game = makeHotspotTestGame();
        const origSetup = game.setup as any;
        game.setup = (...args: any[]) => {
            const G = origSetup(...args);
            // Empty supply: remove inf_p0_supply
            const supplyId = `${CoreZoneNames.PersonalSupply}:0`;
            G.zones[supplyId].items = [];
            delete G.objects['inf_p0_supply'];
            return G;
        };

        const client = Client({ game, numPlayers: 2 });
        client.start();

        client.moves.placeTile({ targetCoord: '0,1' });

        const state = client.getState()!;
        // Hotspot DOES trigger, but no influence to place → center still has 1
        const centerZone = state.G.zones['tile_center'];
        const infCount = centerZone.items.filter(
            (id: string) => state.G.objects[id]?.type === 'Influence'
        ).length;
        expect(infCount).toBe(1);
    });
});
