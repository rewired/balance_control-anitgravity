import { beforeEach, describe, it, expect } from 'vitest';
import { Server, Origins } from 'boardgame.io/server';
import { createBalanceControlGame } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';

describe('server smoke', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('creates a server with BalanceControl', () => {
        const server = Server({ games: [createBalanceControlGame()], origins: [Origins.LOCALHOST] });
        expect(server).toBeTruthy();
    });
});
