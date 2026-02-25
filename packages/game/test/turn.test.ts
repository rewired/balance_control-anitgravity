import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from '../src/index';
import { CoreZoneName } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { registerTestPacks } from './_helpers/registerPacks';
import { EnginePackRegistry } from '../src/expansion-registry';

let BalanceControlNoPlayerView: ReturnType<typeof createBalanceControlGame>;

const HEX_DIRECTIONS: Array<[number, number]> = [
    [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]
];

function findFirstOpenNeighborCoord(grid: Record<string, string>): string {
    const occupiedCoords = Object.keys(grid).sort();

    for (const coord of occupiedCoords) {
        const [q, r] = coord.split(',').map(Number);
        for (const [dq, dr] of HEX_DIRECTIONS) {
            const candidate = `${q + dq},${r + dr}`;
            if (!grid[candidate]) return candidate;
        }
    }

    return '0,1';
}

function createTinyDrawPileGame() {
    return {
        ...BalanceControlNoPlayerView,
        setup: (ctx: any) => {
            const G = SetupGame({ ctx });
            const drawPile = G.zones[CoreZoneName.DrawPile];
            drawPile.items = drawPile.items.slice(0, 1);
            return G;
        }
    };
}

function createMetaMarkerPersistenceGame() {
    return {
        ...BalanceControlNoPlayerView,
        setup: (ctx: any) => {
            const G = SetupGame({ ctx });
            const pid = String(G.engine.attributes.startingPlayerIndex ?? 0);
            const markerId = `meta_${pid}`;
            const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
            if (!G.zones[supplyId]) {
                G.zones[supplyId] = { id: supplyId, name: supplyId, items: [] };
            }
            if (!G.objects[markerId]) {
                G.objects[markerId] = { id: markerId, type: 'MetaMarker', owner: pid } as any;
                G.zones[supplyId].items.push(markerId);
            }
            const marker = G.objects[markerId] as any;
            G.zones[supplyId].items = G.zones[supplyId].items.filter(id => id !== marker.id);
            G.zones['tile_start_committee'].items.push(marker.id);
            marker.mode = 'ReturnPenalty';
            return G;
        }
    };
}

function getTileIdAtCoord(G: any, coord: string): string {
    const tileId = G.grid?.[coord];
    if (!tileId || typeof tileId !== 'string') {
        throw new Error(`Expected tile at coord ${coord}`);
    }
    return tileId;
}

describe('Turn Structure (Stages)', () => {
    beforeEach(() => {
        registerTestPacks();
        const balanceControl = createBalanceControlGame();
        BalanceControlNoPlayerView = {
            ...balanceControl,
            playerView: ({ G }: any) => G
        };
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('should start in drawAndPlace stage', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 2 });
        client.start();

        const state = client.store.getState();
        const ctx = state.ctx;
        const pid = ctx.currentPlayer;

        // Check activePlayers for stage
        expect(ctx.activePlayers[pid]).toBe('drawAndPlace');

        // Check Staging populated
        const stagingId = `staging_${pid}`;
        const staging = state.G.zones[stagingId];
        expect(staging).toBeDefined();
        // Since we enabled logic again, setup + onBegin should run
        expect(staging.items.length).toBeGreaterThan(0);
    });

    it('should transition to politicalAction stage after placing tile', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 2 });
        client.start();

        const pid = client.getState().ctx.currentPlayer;

        // placeTile
        client.moves.placeTile({ targetCoord: '1,0' });

        const state = client.store.getState();
        // Should be in politicalAction
        expect(state.ctx.activePlayers[pid]).toBe('politicalAction');
    });

    it('should reject political moves during drawAndPlace stage without mutation', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 2 });
        client.start();

        const beforeState = client.getState();
        const beforeG = JSON.stringify(beforeState.G);
        const beforePlayer = beforeState.ctx.currentPlayer;
        const beforeStage = beforeState.ctx.activePlayers[beforePlayer];
        const boardTileId = Object.values(beforeState.G.grid)[0] as string;

        client.moves.placeInfluence({ targetTileId: boardTileId });
        client.moves.moveInfluence({ sourceId: boardTileId, targetId: boardTileId });
        client.moves.formalizeInfluence({ targetTileId: boardTileId });
        client.moves.convertResources({ targetTileId: boardTileId, from: ['DOM'], to: 'FOR' });

        const afterState = client.getState();
        expect(JSON.stringify(afterState.G)).toBe(beforeG);
        expect(afterState.ctx.currentPlayer).toBe(beforePlayer);
        expect(afterState.ctx.activePlayers[beforePlayer]).toBe(beforeStage);
        expect(afterState.ctx.activePlayers[beforePlayer]).toBe('drawAndPlace');
    });

    it('should end turn after taking a political action', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 2 });
        client.start();
        const initialPlayer = client.getState().ctx.currentPlayer;

        // 1. Place Tile
        const targetCoord = '1,0';
        client.moves.placeTile({ targetCoord });

        // 2. Take a CORE political action (PlaceInfluence)
        const tileId = getTileIdAtCoord(client.getState().G, targetCoord);
        client.moves.placeInfluence({ targetTileId: tileId });

        const state = client.store.getState();
        expect(state.ctx.currentPlayer).not.toBe(initialPlayer);

        // New player should be in drawAndPlace
        const newPid = state.ctx.currentPlayer;
        expect(state.ctx.activePlayers[newPid]).toBe('drawAndPlace');
    });

    it('should reject placeTile during politicalAction stage without mutation', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 2 });
        client.start();

        const pid = client.getState().ctx.currentPlayer;
        client.moves.placeTile({ targetCoord: '1,0' });

        const beforeState = client.getState();
        const beforeG = JSON.stringify(beforeState.G);
        const beforeCurrentPlayer = beforeState.ctx.currentPlayer;
        const beforeStage = beforeState.ctx.activePlayers[pid];
        client.moves.placeTile({ targetCoord: '1,-1' });
        const afterState = client.getState();
        const afterG = JSON.stringify(afterState.G);

        expect(afterG).toBe(beforeG);
        expect(afterState.ctx.currentPlayer).toBe(beforeCurrentPlayer);
        expect(afterState.ctx.activePlayers[pid]).toBe(beforeStage);
        expect(afterState.ctx.activePlayers[pid]).toBe('politicalAction');
    });

    it('should immediately end after final settlement when DrawPile empties during draw-and-place (CORE-01-09-01A, CORE-01-09-02)', () => {
        const client = Client({ game: createTinyDrawPileGame(), numPlayers: 1 });
        client.start();

        const stateAfterStart = client.getState();
        expect(stateAfterStart.G.zones[CoreZoneName.DrawPile].items.length).toBe(0);
        expect(stateAfterStart.ctx.gameover).toBeUndefined();

        client.moves.placeTile({ targetCoord: '1,0' });
        const afterPlaceState = client.getState();
        expect(afterPlaceState.ctx.gameover).toBeUndefined();

        client.events.endTurn();
        const settledState = client.getState();

        expect(settledState.G.roundNumber).toBe(1);
        expect(settledState.G.roundSettlementDone).toBe(true);
        expect(settledState.ctx.gameover).toBeDefined();

        const beforeIllegalPoliticalAction = JSON.stringify(settledState.G);
        const placedTileId = getTileIdAtCoord(settledState.G, '1,0');
        client.moves.placeInfluence({ targetTileId: placedTileId });
        const afterIllegalPoliticalAction = client.getState();

        expect(JSON.stringify(afterIllegalPoliticalAction.G)).toBe(beforeIllegalPoliticalAction);
        expect(afterIllegalPoliticalAction.ctx.gameover).toEqual(settledState.ctx.gameover);
    });

    it('should return meta-markers to supply when not updated by Political Action', () => {
        const client = Client({ game: createMetaMarkerPersistenceGame(), numPlayers: 2 });
        client.start();

        const startState = client.getState();
        const pid = startState.ctx.currentPlayer;
        const marker = startState.G.objects[`meta_${pid}`] as any;
        expect(marker).toBeTruthy();
        expect(startState.G.zones['tile_start_committee'].items).toContain(marker.id);

        const firstCoord = findFirstOpenNeighborCoord(startState.G.grid);
        client.moves.placeTile({ targetCoord: firstCoord });
        client.moves.placeInfluence({ targetTileId: getTileIdAtCoord(client.getState().G, firstCoord) });

        const afterActionState = client.getState();
        expect(afterActionState.G.zones['tile_start_committee'].items).not.toContain(marker.id);
        expect(afterActionState.G.zones[`PersonalSupply:${pid}`].items).toContain(marker.id);
    });

    it('should complete two full rounds in 3-player hotseat without softlock', () => {
        const client = Client({ game: BalanceControlNoPlayerView, numPlayers: 3 });
        client.start();

        for (let turn = 0; turn < 6; turn++) {
            const beforePlace = client.getState();
            const pid = beforePlace.ctx.currentPlayer;
            expect(beforePlace.ctx.activePlayers[pid]).toBe('drawAndPlace');

            const targetCoord = findFirstOpenNeighborCoord(beforePlace.G.grid);
            client.moves.placeTile({ targetCoord });

            const afterPlace = client.getState();
            expect(afterPlace.ctx.currentPlayer).toBe(pid);
            expect(afterPlace.ctx.activePlayers[pid]).toBe('politicalAction');

            const tileId = getTileIdAtCoord(client.getState().G, targetCoord);
            client.moves.placeInfluence({ targetTileId: tileId });

            const afterAction = client.getState();
            expect(afterAction.ctx.currentPlayer).not.toBe(pid);
        }

        const finalState = client.getState();
        expect(finalState.G.roundNumber).toBe(2);
    });
});
