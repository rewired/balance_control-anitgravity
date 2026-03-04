import { beforeEach, describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Game } from 'boardgame.io';
import { CoreMoves } from '../src/moves';
import { TileType, CoreZoneName, GameState, GameObject } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

function makeConversionMarkerTestGame(): Game {
    return {
        name: 'conversion-marker-test',
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

            G.zones[CoreZoneName.Board] = { id: CoreZoneName.Board, name: 'Board', items: [] };
            G.zones[CoreZoneName.Bank] = { id: CoreZoneName.Bank, name: 'Bank', items: [] };
            G.zones[CoreZoneName.PersonalSupply + ':0'] = { id: CoreZoneName.PersonalSupply + ':0', name: 'Supply 0', items: [] };

            const grassrootsId = 'tile_grassroots';
            G.tiles[grassrootsId] = {
                id: grassrootsId,
                type: TileType.Grassroots,
                conversion: { inputSlots: 2, outputSlots: 1, typedResort: 'DOM' },
                resort: 'DOM'
            };
            G.zones[CoreZoneName.Board].items.push(grassrootsId);
            G.grid['0,0'] = grassrootsId;
            G.zones[grassrootsId] = { id: grassrootsId, name: 'Grassroots', items: [] };

            // Player 0 must control it
            const infOnTile = 'inf_p0_on_grassroots';
            G.objects[infOnTile] = { id: infOnTile, type: 'Influence', owner: '0' };
            G.zones[grassrootsId].items.push(infOnTile);

            // Resources to pay
            for (let i = 0; i < 3; i++) {
                const rid = `res_p0_${i}`;
                G.objects[rid] = { id: rid, type: 'Resource', resort: 'DOM', owner: '0' };
                G.zones[CoreZoneName.PersonalSupply + ':0'].items.push(rid);
            }

            const metaId = 'meta_0';
            G.objects[metaId] = { id: metaId, type: 'MetaMarker', owner: '0' };
            G.zones[CoreZoneName.PersonalSupply + ':0'].items.push(metaId);

            return G;
        },
        moves: CoreMoves,
        turn: {
            activePlayers: { currentPlayer: 'politicalAction' },
            stages: {
                politicalAction: { moves: CoreMoves },
            },
        },
    };
}

describe('Conversion Marker Placement', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('should place meta-marker on grassroots tile after conversion', () => {
        const game = makeConversionMarkerTestGame();
        const client = Client({ game, numPlayers: 1 });
        client.start();

        const state0 = client.getState()!;
        const metaId = 'meta_0';

        // Initial state: meta-marker in supply
        expect(state0.G.zones[CoreZoneName.PersonalSupply + ':0'].items).toContain(metaId);

        client.moves.convertResources({
            grassrootsTileId: 'tile_grassroots',
            inputCount: 2,
            outputResort: 'DOM'
        });

        const state1 = client.getState()!;

        // Final state: meta-marker on the tile
        expect(state1.G.zones['tile_grassroots'].items).toContain(metaId);
        expect(state1.G.objects[metaId].mode).toBe('Convert');

        // Supply should not contain it anymore
        expect(state1.G.zones[CoreZoneName.PersonalSupply + ':0'].items).not.toContain(metaId);
    });
});
