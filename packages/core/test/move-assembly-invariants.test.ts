import { beforeEach, describe, expect, it } from 'vitest';
import type { GameConfig, ExpansionFlags } from '@balance-control/rules';
import { EnginePackRegistry } from '@balance-control/game';
import { createBalanceControlGame } from '@balance-control/game';
import { buildExpansionMovesForConfig, getEnabledMoveModules } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeTestPack } from './_helpers/makeTestPack';

function cfg(expansions: Partial<ExpansionFlags>): GameConfig {
    return {
        expansions: {
            ex01: expansions.ex01 === true,
            ex02: expansions.ex02 === true,
            ex03: expansions.ex03 === true,
        },
    };
}

describe('Move assembly invariants', () => {
    const resetRegistry = () => {
        registerTestPacks();
    };

    beforeEach(() => {
        resetRegistry();
    });

    it('disabled expansion contributes no move modules', () => {
        resetRegistry();
        const mockPack = makeTestPack({
            id: 'exp01',
            name: 'Mock EX01',
            moves: {
                'tripwire.ex01.only': () => null,
            },
        });

        EnginePackRegistry.registerPack(mockPack);

        const modules = getEnabledMoveModules(cfg({ ex01: false, ex02: false, ex03: false }));
        expect(modules.map((m) => m.moduleId)).toEqual(['core']);
    });

    it('module ordering equals canonical order filtered by enablement (independent of registration order)', () => {
        resetRegistry();
        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp03',
                name: 'Mock EX03',
                moves: { 'tripwire.ex03.only': () => null },
            })
        );

        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp01',
                name: 'Mock EX01',
                moves: { 'tripwire.ex01.only': () => null },
            })
        );

        const modules = getEnabledMoveModules(cfg({ ex01: true, ex02: false, ex03: true }));
        expect(modules.map((m) => m.moduleId)).toEqual(['core', 'exp01', 'exp03']);
    });

    it('duplicate move keys fail deterministically', () => {
        resetRegistry();
        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp02',
                name: 'Mock EX02',
                moves: { 'tripwire.dupe': () => null },
            })
        );

        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp01',
                name: 'Mock EX01',
                moves: { 'tripwire.dupe': () => null },
            })
        );

        expect(() => buildExpansionMovesForConfig(cfg({ ex01: true, ex02: true, ex03: false }))).toThrowError(
            ['MoveModuleRegistry: duplicate move registrations are forbidden.', 'Conflicts:', '- exp02 registers "tripwire.dupe" but it is already registered by exp01'].join(
                '\n'
            )
        );
    });

    it('factory-built Game keeps expansion moves stage-scoped (not root-exposed)', () => {
        resetRegistry();
        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp01',
                name: 'Mock EX01',
                moves: { 'tripwire.ex01.only': () => null },
            })
        );

        const game = createBalanceControlGame() as any;
        expect(typeof game.moves?.resolveChoice).toBe('function');
        expect(game.moves?.['tripwire.ex01.only']).toBeUndefined();
        expect(game.moves?.placeInfluence).toBeUndefined();
        expect(typeof game.turn?.stages?.politicalAction?.moves?.['tripwire.ex01.only']).toBe('function');
        expect(typeof game.turn?.stages?.politicalAction?.moves?.placeInfluence).toBe('function');
    });

    it('factory-built Game throws deterministically on duplicate move ids (superset)', () => {
        resetRegistry();
        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp02',
                name: 'Mock EX02',
                moves: { 'tripwire.dupe.factory': () => null },
            })
        );
        EnginePackRegistry.registerPack(
            makeTestPack({
                id: 'exp01',
                name: 'Mock EX01',
                moves: { 'tripwire.dupe.factory': () => null },
            })
        );

        expect(() => createBalanceControlGame()).toThrowError(
            [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "tripwire.dupe.factory" but it is already registered by exp01',
            ].join('\n')
        );
    });

    it('factory-built Game throws when core pack is missing', () => {
        resetRegistry();
        EnginePackRegistry.clear();
        expect(() => createBalanceControlGame()).toThrowError(
            'Required pack not registered. Register the required pack (e.g. CorePack) before calling createBalanceControlGame().'
        );
    });
});
