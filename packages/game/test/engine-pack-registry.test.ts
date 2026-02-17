import { beforeEach, describe, expect, it } from 'vitest';
import type { GameConfig, ExpansionFlags } from '@balance-control/rules';
import { EnginePackRegistry } from '../src/expansion-registry';
import { buildMovesForConfig } from '../src/move-assembly';
import { CorePack } from '../src/packs/core';

function cfg(expansions: Partial<ExpansionFlags>): GameConfig {
    return {
        expansions: {
            ex01: expansions.ex01 === true,
            ex02: expansions.ex02 === true,
            ex03: expansions.ex03 === true,
        },
    };
}

describe('EnginePackRegistry', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
    });

    it('returns registered packs in canonical order (independent of registration order)', () => {
        EnginePackRegistry.registerPack({ id: 'exp03', name: 'E3' });
        EnginePackRegistry.registerPack({ id: 'exp01', name: 'E1' });

        expect(EnginePackRegistry.getRegisteredPacks().map((p) => p.id)).toEqual(['exp01', 'exp03']);
    });

    it('enables core even when core pack is not registered', () => {
        EnginePackRegistry.registerPack({ id: 'exp01', name: 'E1' });
        expect(EnginePackRegistry.getEnabledPacks(undefined, cfg({ ex01: false })).map((p) => p.id)).toEqual(['core']);
    });

    it('rejects duplicate pack id registrations deterministically', () => {
        EnginePackRegistry.registerPack({ id: 'exp01', name: 'E1' });
        expect(() => EnginePackRegistry.registerPack({ id: 'exp01', name: 'E1b' })).toThrowError('EnginePackRegistry: pack "exp01" already registered.');
    });

    it('rejects duplicate move ids across packs deterministically (no silent overwrite)', () => {
        EnginePackRegistry.registerPack(CorePack);
        EnginePackRegistry.registerPack({
            id: 'exp01',
            name: 'E1',
            moves: { 'tripwire.dupe.pack': () => null },
        });
        EnginePackRegistry.registerPack({
            id: 'exp02',
            name: 'E2',
            moves: { 'tripwire.dupe.pack': () => null },
        });

        expect(() => buildMovesForConfig(cfg({ ex01: true, ex02: true }))).toThrowError(
            [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "tripwire.dupe.pack" but it is already registered by exp01',
            ].join('\n')
        );
    });

});
