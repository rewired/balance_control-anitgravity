import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { BalanceControl } from '../src/index';

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

describe('Turn Structure (Stages)', () => {
    it('should start in drawAndPlace stage', () => {
        const client = Client({ game: BalanceControl, numPlayers: 2 });
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
        const client = Client({ game: BalanceControl, numPlayers: 2 });
        client.start();

        const pid = client.getState().ctx.currentPlayer;

        // placeTile
        client.moves.placeTile({ targetCoord: '1,0' });

        const state = client.store.getState();
        // Should be in politicalAction
        expect(state.ctx.activePlayers[pid]).toBe('politicalAction');
    });

    it('should end turn after passing', () => {
        const client = Client({ game: BalanceControl, numPlayers: 2 });
        client.start();
        const initialPlayer = client.getState().ctx.currentPlayer;

        // 1. Place Tile
        client.moves.placeTile({ targetCoord: '1,0' });

        // 2. Pass
        client.moves.pass({});

        const state = client.store.getState();
        expect(state.ctx.currentPlayer).not.toBe(initialPlayer);

        // New player should be in drawAndPlace
        const newPid = state.ctx.currentPlayer;
        expect(state.ctx.activePlayers[newPid]).toBe('drawAndPlace');
    });

    it('should reject placeTile during politicalAction stage without mutation', () => {
        const client = Client({ game: BalanceControl, numPlayers: 2 });
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

    it('should complete two full rounds in 3-player hotseat without softlock', () => {
        const client = Client({ game: BalanceControl, numPlayers: 3 });
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

            client.moves.pass({});

            const afterPass = client.getState();
            expect(afterPass.ctx.currentPlayer).not.toBe(pid);
        }

        const finalState = client.getState();
        expect(finalState.G.roundNumber).toBe(2);
    });
});
