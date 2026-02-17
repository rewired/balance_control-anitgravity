import { beforeEach, describe, expect, it } from 'vitest';
import type { GameConfig, ExpansionFlags } from '@balance-control/rules';
import { EnginePackRegistry } from '../src/expansion-registry';
import { buildMovesForConfig } from '../src/move-assembly';
import { CorePack } from '../src/packs/core';
import type { EnginePackDefinition, EnginePackId, PackManifest } from '../src/packs/types';

function cfg(expansions: Partial<ExpansionFlags>): GameConfig {
    return {
        expansions: {
            ex01: expansions.ex01 === true,
            ex02: expansions.ex02 === true,
            ex03: expansions.ex03 === true,
        },
    };
}

function manifest(id: EnginePackId, required = false): PackManifest {
    return {
        id,
        packVersion: '0.0.0',
        rulesetAnchor: `${id} v0.0.0`,
        required,
    };
}

function pack(id: EnginePackId, name: string, moves?: Record<string, (...args: any[]) => any>): EnginePackDefinition {
    return {
        id,
        name,
        manifest: manifest(id, id === 'core'),
        moves,
    };
}

describe('EnginePackRegistry', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
    });

    it('returns registered packs in canonical order (independent of registration order)', () => {
        EnginePackRegistry.registerPack(pack('exp03', 'E3'));
        EnginePackRegistry.registerPack(pack('exp01', 'E1'));

        expect(EnginePackRegistry.getRegisteredPacks().map((p) => p.id)).toEqual(['exp01', 'exp03']);
    });

    it('fails when core pack is missing', () => {
        EnginePackRegistry.registerPack(pack('exp01', 'E1'));
        expect(() => EnginePackRegistry.getEnabledPacks(undefined, cfg({ ex01: false }))).toThrowError(
            'EnginePackRegistry: pack "core" is not registered.'
        );
    });

    it('rejects duplicate pack id registrations deterministically', () => {
        EnginePackRegistry.registerPack(pack('exp01', 'E1'));
        expect(() => EnginePackRegistry.registerPack(pack('exp01', 'E1b'))).toThrowError(
            'EnginePackRegistry: pack "exp01" already registered.'
        );
    });

    it('rejects duplicate move ids across packs deterministically (no silent overwrite)', () => {
        EnginePackRegistry.registerPack(CorePack);
        EnginePackRegistry.registerPack(pack('exp01', 'E1', { 'tripwire.dupe.pack': () => null }));
        EnginePackRegistry.registerPack(pack('exp02', 'E2', { 'tripwire.dupe.pack': () => null }));

        expect(() => buildMovesForConfig(cfg({ ex01: true, ex02: true }))).toThrowError(
            [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "tripwire.dupe.pack" but it is already registered by exp01',
            ].join('\n')
        );
    });

    it('returns pack manifests in deterministic order', () => {
        EnginePackRegistry.registerPack(pack('exp02', 'E2'));
        EnginePackRegistry.registerPack(pack('exp01', 'E1'));

        expect(EnginePackRegistry.getPackManifests().map((m) => m.id)).toEqual(['exp01', 'exp02']);
    });

    it('rejects unknown pack ids in enabled pack selection', () => {
        EnginePackRegistry.registerPack(CorePack);
        expect(() =>
            EnginePackRegistry.getEnabledPacks(undefined, {
                expansions: { ex01: false, ex02: false, ex03: false },
                packs: { enabledPacks: ['exp99'] as any },
            })
        ).toThrowError('EnginePackRegistry: unknown pack id "exp99".');
    });
});
