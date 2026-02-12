import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { BalanceControl } from '../src/index';

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
        const stagingId = `staging_${pid}`;
        const tileId = client.getState().G.zones[stagingId].items[0];

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
});
