import { describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import { BalanceControlGame } from '../src/game';

function pickFirstIntent(intents: LegalIntent[], moveType: string): LegalIntent | null {
    return intents.find((i) => i.moveType === moveType) ?? null;
}

function dispatchIntent(client: any, intent: LegalIntent): void {
    const moveFn = client.moves?.[intent.moveType];
    if (typeof moveFn !== 'function') {
        throw new Error(`Move "${intent.moveType}" not found on client.moves.`);
    }
    if (intent.payload !== undefined) {
        moveFn(intent.payload);
    } else {
        moveFn();
    }
}

describe('Hotseat regression: seat switch keeps render + move authority unified', () => {
    it('advances P0 turn, switches to P1, and still offers legal placeTile intents', () => {
        const client = Client({
            game: BalanceControlGame,
            numPlayers: 2,
            matchID: 'test-hotseat-0220',
            playerID: '0',
            multiplayer: Local(),
        });

        client.start();

        try {
            let state = client.getState();
            const startingPid = String(state.ctx.currentPlayer ?? '0') as '0' | '1';
            const otherPid = (startingPid === '0' ? '1' : '0') as '0' | '1';

            client.updatePlayerID(startingPid);

            // Starting player drawAndPlace: choose any legal placeTile intent and execute it.
            state = client.getState();
            const drawIntents = enumerateLegalIntents(state.G, state.ctx, startingPid);
            const placeTile = pickFirstIntent(drawIntents, 'placeTile');
            expect(placeTile).toBeTruthy();
            dispatchIntent(client, placeTile!);

            // Starting player politicalAction: choose a legal intent that ends the turn.
            state = client.getState();
            const politicalIntents = enumerateLegalIntents(state.G, state.ctx, startingPid);
            const preferredPolitical = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources'];
            const preferred =
                preferredPolitical.map((t) => pickFirstIntent(politicalIntents, t)).find(Boolean) ?? null;

            if (preferred) {
                dispatchIntent(client, preferred);
            } else {
                const beforePlayer = state.ctx.currentPlayer;
                const beforeTurn = state.ctx.turn;
                const maxAttempts = 5;
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const cur = client.getState();
                    const curIntents = enumerateLegalIntents(cur.G, cur.ctx, startingPid);
                    const intent = curIntents.find((i) => i.moveType !== 'resolveChoice') ?? null;
                    if (!intent) break;
                    dispatchIntent(client, intent);
                    const next = client.getState();
                    if (next.ctx.currentPlayer !== beforePlayer || next.ctx.turn !== beforeTurn) break;
                }
            }

            state = client.getState();
            expect(state.ctx.currentPlayer).toBe(otherPid);

            // Hotseat seat switch to next player: update player view, then enumerate drawAndPlace intents.
            client.updatePlayerID(otherPid);
            state = client.getState();
            const nextPlayerIntents = enumerateLegalIntents(state.G, state.ctx, otherPid);
            const nextPlayerPlaceTile = nextPlayerIntents.filter((i) => i.moveType === 'placeTile');
            expect(nextPlayerPlaceTile.length).toBeGreaterThan(0);
        } finally {
            client.stop();
        }
    });
});
