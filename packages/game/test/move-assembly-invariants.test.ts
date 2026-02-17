import { beforeEach, describe, expect, it } from 'vitest';
import type { ExpansionDefinition, GameConfig, ExpansionFlags } from '@balance-control/rules';
import { ExpansionRegistry } from '../src/expansion-registry';
import { createBalanceControlGame } from '../src/index';
import { buildExpansionMovesForConfig, getEnabledMoveModules } from '../src/move-assembly';
import { registerTestPacks } from './_helpers/registerPacks';

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
    beforeEach(() => {
        registerTestPacks();
    });

    it('disabled expansion contributes no move modules', () => {
        const mockEx01: ExpansionDefinition = {
            id: 'exp01',
            name: 'Mock EX01',
            moves: {
                'tripwire.ex01.only': () => null,
            },
        };

        ExpansionRegistry.register(mockEx01);

        const modules = getEnabledMoveModules(cfg({ ex01: false, ex02: false, ex03: false }));
        expect(modules.map((m) => m.moduleId)).toEqual(['core']);
    });

    it('module ordering equals canonical order filtered by enablement (independent of registration order)', () => {
        ExpansionRegistry.register({
            id: 'exp03',
            name: 'Mock EX03',
            moves: { 'tripwire.ex03.only': () => null },
        });

        ExpansionRegistry.register({
            id: 'exp01',
            name: 'Mock EX01',
            moves: { 'tripwire.ex01.only': () => null },
        });

        const modules = getEnabledMoveModules(cfg({ ex01: true, ex02: false, ex03: true }));
        expect(modules.map((m) => m.moduleId)).toEqual(['core', 'exp01', 'exp03']);
    });

    it('duplicate move keys fail deterministically', () => {
        ExpansionRegistry.register({
            id: 'exp02',
            name: 'Mock EX02',
            moves: { 'tripwire.dupe': () => null },
        });

        ExpansionRegistry.register({
            id: 'exp01',
            name: 'Mock EX01',
            moves: { 'tripwire.dupe': () => null },
        });

        expect(() => buildExpansionMovesForConfig(cfg({ ex01: true, ex02: true, ex03: false }))).toThrowError(
            ['MoveModuleRegistry: duplicate move registrations are forbidden.', 'Conflicts:', '- exp02 registers "tripwire.dupe" but it is already registered by exp01'].join(
                '\n'
            )
        );
    });

    it('factory-built Game includes registered expansion moves (superset, no import-time assembly)', () => {
        ExpansionRegistry.register({
            id: 'exp01',
            name: 'Mock EX01',
            moves: { 'tripwire.ex01.only': () => null },
        });

        const game = createBalanceControlGame() as any;
        expect(typeof game.moves?.['tripwire.ex01.only']).toBe('function');
        expect(typeof game.turn?.stages?.politicalAction?.moves?.['tripwire.ex01.only']).toBe('function');
    });

    it('factory-built Game throws deterministically on duplicate move ids (superset)', () => {
        ExpansionRegistry.register({
            id: 'exp02',
            name: 'Mock EX02',
            moves: { 'tripwire.dupe.factory': () => null },
        });
        ExpansionRegistry.register({
            id: 'exp01',
            name: 'Mock EX01',
            moves: { 'tripwire.dupe.factory': () => null },
        });

        expect(() => createBalanceControlGame()).toThrowError(
            [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "tripwire.dupe.factory" but it is already registered by exp01',
            ].join('\n')
        );
    });

    it('factory-built Game throws when core pack is missing', () => {
        ExpansionRegistry.clear();
        expect(() => createBalanceControlGame()).toThrowError(
            'Core pack not registered. Register CorePack before calling createBalanceControlGame().'
        );
    });
});
