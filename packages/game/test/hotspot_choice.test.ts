import { beforeEach, describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Game } from 'boardgame.io';
import { CoreMoves } from '../src/moves';
import { TileType, CoreZoneName, GameState } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

function makeHotspotChoiceTestGame(): Game {
    return {
        name: 'hotspot-choice-test',
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
            G.zones[CoreZoneName.PersonalSupply + ':0'] = { id: CoreZoneName.PersonalSupply + ':0', name: 'Supply 0', items: [] };
            G.zones['PersonalSupply:0'] = G.zones[CoreZoneName.PersonalSupply + ':0'];

            const centerId = 'tile_center';
            G.tiles[centerId] = { id: centerId, type: TileType.Resort, weight: 1, resort: 'DOM' };
            G.zones[CoreZoneName.Board].items.push(centerId);
            G.grid['0,0'] = centerId;
            G.zones[centerId] = { id: centerId, name: 'Center', items: [] };

            const infOnTile = 'inf_p0_on_center';
            G.objects[infOnTile] = { id: infOnTile, type: 'Influence', owner: '0' };
            G.zones[centerId].items.push(infOnTile);

            const prefillCoords = ['1,0', '1,-1', '0,-1', '-1,0', '-1,1'];
            prefillCoords.forEach((coord, i) => {
                const tid = `tile_n${i}`;
                G.tiles[tid] = { id: tid, type: TileType.Resort, weight: 1, resort: 'DOM' };
                G.zones[CoreZoneName.Board].items.push(tid);
                G.grid[coord] = tid;
                G.adjacency[tid] = [centerId];
            });

            const triggerTile = 'tile_trigger';
            G.tiles[triggerTile] = { id: triggerTile, type: TileType.Resort, weight: 1, resort: 'FOR' };
            G.zones['staging_0'] = { id: 'staging_0', name: 'staging_0', items: [triggerTile] };

            const metaId = 'meta_0';
            G.objects[metaId] = { id: metaId, type: 'MetaMarker', owner: '0' };
            G.zones[CoreZoneName.PersonalSupply + ':0'].items.push(metaId);

            // Add influence to supply
            for (let i = 0; i < 5; i++) {
                const infId = `inf_p0_supply_${i}`;
                G.objects[infId] = { id: infId, type: 'Influence', owner: '0' };
                G.zones[CoreZoneName.PersonalSupply + ':0'].items.push(infId);
            }

            return G;
        },
        moves: CoreMoves,
        turn: {
            activePlayers: { currentPlayer: 'drawAndPlace' },
            stages: {
                drawAndPlace: { moves: { placeTile: CoreMoves.placeTile }, next: 'politicalAction' },
                politicalAction: { moves: CoreMoves },
            },
        },
    };
}

describe('Hotspot Choice Notification', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('should create a choice.request when a hotspot triggers', () => {
        const game = makeHotspotChoiceTestGame();
        const client = Client({ game, numPlayers: 2 });
        client.start();

        client.moves.placeTile({ targetCoord: '0,1' });

        const state = client.getState()!;
        // The game should now have a pending choice
        expect(state.G.engine.pendingChoice).toBeDefined();
        expect(state.G.engine.pendingChoice.kind).toBe('selectOption');
        expect(state.G.engine.pendingChoice.player).toBe('0');
        expect(state.G.engine.pendingChoice.spec.options).toContain('Receive 1 Influence');

        // Influence should NOT have been placed yet
        const centerZone = state.G.zones['tile_center'];
        const infCount = centerZone.items.filter((id: string) => state.G.objects[id]?.type === 'Influence').length;
        expect(infCount).toBe(1); // Still just the original

        // Resolve the choice
        client.moves.resolveChoice({
            choiceId: state.G.engine.pendingChoice.choiceId,
            selection: 'Receive 1 Influence'
        });

        const stateAfter = client.getState()!;
        if (stateAfter.G.engine.pendingChoice) {
            console.error('Pending choice still exists:', stateAfter.G.engine.pendingChoice);
        }
        expect(stateAfter.G.engine.pendingChoice).toBeFalsy();

        // Influence SHOULD now be placed
        const centerZoneAfter = stateAfter.G.zones['tile_center'];
        const infCountAfter = centerZoneAfter.items.filter((id: string) => stateAfter.G.objects[id]?.type === 'Influence').length;
        expect(infCountAfter).toBe(2);
    });
});
