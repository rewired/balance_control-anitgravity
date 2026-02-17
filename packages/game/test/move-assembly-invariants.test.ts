import { beforeEach, describe, expect, it } from 'vitest';
import type { ExpansionDefinition, GameConfig, ExpansionFlags } from '@balance-control/rules';
import { ExpansionRegistry } from '../src/expansion-registry';
import { buildExpansionMovesForConfig, getEnabledMoveModules } from '../src/move-assembly';

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
        ExpansionRegistry.clear();
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
});

