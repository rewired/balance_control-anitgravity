import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { BalanceControl } from '../src/index';
import { CoreZoneNames } from '@balance-control/rules';
import { SetupGame } from '../src/setup';

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
        ...BalanceControl,
        setup: (ctx: any) => {
            const G = SetupGame({ ctx });
            const drawPile = G.zones[CoreZoneNames.DrawPile];
            drawPile.items = drawPile.items.slice(0, 1);
            return G;
        }
    };
}

function createMetaMarkerRoundReturnGame() {
    return {
        ...BalanceControl,
        setup: (ctx: any) => {
            const G = SetupGame({ ctx });
            const markerId = 'meta_0';
            const supplyId = `${CoreZoneNames.PersonalSupply}:0`;
            if (!G.zones[supplyId]) {
                G.zones[supplyId] = { id: supplyId, name: supplyId, items: [] };
            }
            if (!G.objects[markerId]) {
                G.objects[markerId] = { id: markerId, type: 'MetaMarker', owner: '0' } as any;
                G.zones[supplyId].items.push(markerId);
            }
            const marker = G.objects[markerId] as any;
            G.zones[supplyId].items = G.zones[supplyId].items.filter(id => id !== marker.id);
            G.zones['tile_start_committee'].items.push(marker.id);
            marker.mode = 'Shift';
            marker.expiresRound = 1;
            return G;
        }
    };
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

    it('should reject passTilePlacement when a staging tile exists', () => {
        const client = Client({ game: BalanceControl, numPlayers: 2 });
        client.start();

        const beforeState = client.getState();
        const pid = beforeState.ctx.currentPlayer;
        const beforeG = JSON.stringify(beforeState.G);

        client.moves.passTilePlacement({});

        const afterState = client.getState();
        const afterG = JSON.stringify(afterState.G);

        expect(afterG).toBe(beforeG);
        expect(afterState.ctx.currentPlayer).toBe(pid);
        expect(afterState.ctx.activePlayers[pid]).toBe('drawAndPlace');
    });

    it('should allow passTilePlacement when staging is empty and continue turn flow', () => {
        const client = Client({ game: createTinyDrawPileGame(), numPlayers: 2 });
        client.start();

        client.moves.placeTile({ targetCoord: '1,0' });
        client.moves.pass({});

        const secondState = client.getState();
        const secondPid = secondState.ctx.currentPlayer;
        expect(secondState.ctx.activePlayers[secondPid]).toBe('drawAndPlace');
        expect(secondState.G.zones[`staging_${secondPid}`].items.length).toBe(0);

        client.moves.passTilePlacement({});

        const afterStageSkip = client.getState();
        expect(afterStageSkip.ctx.currentPlayer).toBe(secondPid);
        expect(afterStageSkip.ctx.activePlayers[secondPid]).toBe('politicalAction');
    });

    it('should end only after round settlement when draw pile empties mid-round', () => {
        const client = Client({ game: createTinyDrawPileGame(), numPlayers: 2 });
        client.start();

        const stateAfterStart = client.getState();
        expect(stateAfterStart.G.zones[CoreZoneNames.DrawPile].items.length).toBe(0);

        client.moves.placeTile({ targetCoord: '1,0' });
        client.moves.pass({});

        const midRoundState = client.getState();
        const secondPid = midRoundState.ctx.currentPlayer;
        expect(midRoundState.ctx.gameover).toBeUndefined();
        expect(midRoundState.G.roundSettlementDone).toBeUndefined();
        expect(midRoundState.G.roundNumber ?? 0).toBe(0);
        expect(midRoundState.ctx.activePlayers[secondPid]).toBe('drawAndPlace');
        expect(midRoundState.G.zones[`staging_${secondPid}`].items.length).toBe(0);

        client.moves.passTilePlacement({});
        client.moves.pass({});

        const finalState = client.getState();
        expect(finalState.G.roundNumber).toBe(1);
        expect(finalState.G.roundSettlementDone).toBe(true);
        expect(finalState.ctx.gameover).toBeDefined();
    });

    it('should return expiring meta-markers at round start', () => {
        const client = Client({ game: createMetaMarkerRoundReturnGame(), numPlayers: 2 });
        client.start();

        const startState = client.getState();
        const marker = startState.G.objects['meta_0'] as any;
        expect(marker).toBeTruthy();
        expect(startState.G.zones['tile_start_committee'].items).toContain(marker.id);

        const firstCoord = findFirstOpenNeighborCoord(startState.G.grid);
        client.moves.placeTile({ targetCoord: firstCoord });
        client.moves.pass({});

        const secondState = client.getState();
        const secondCoord = findFirstOpenNeighborCoord(secondState.G.grid);
        client.moves.placeTile({ targetCoord: secondCoord });
        client.moves.pass({});

        const roundStartState = client.getState();
        expect(roundStartState.ctx.currentPlayer).toBe('0');
        expect(roundStartState.G.zones['tile_start_committee'].items).not.toContain(marker.id);
        expect(roundStartState.G.zones['PersonalSupply:0'].items).toContain(marker.id);
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
