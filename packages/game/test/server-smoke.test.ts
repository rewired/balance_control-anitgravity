import { beforeEach, describe, it, expect } from 'vitest';
import { Server, Origins } from 'boardgame.io/server';
import { createBalanceControlGame } from '../src/index';
import { EnginePackRegistry, ExpansionRegistry } from '../src/expansion-registry';
import { CorePack } from '../src/packs/core';

describe('server smoke', () => {
    beforeEach(() => {
        ExpansionRegistry.clear();
        EnginePackRegistry.registerPack(CorePack);
    });

    it('creates a server with BalanceControl', () => {
        const server = Server({ games: [createBalanceControlGame()], origins: [Origins.LOCALHOST] });
        expect(server).toBeTruthy();
    });
});
