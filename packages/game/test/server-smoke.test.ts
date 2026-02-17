import { describe, it, expect } from 'vitest';
import { Server, Origins } from 'boardgame.io/server';
import { createBalanceControlGame } from '../src/index';

describe('server smoke', () => {
    it('creates a server with BalanceControl', () => {
        const server = Server({ games: [createBalanceControlGame()], origins: [Origins.LOCALHOST] });
        expect(server).toBeTruthy();
    });
});
