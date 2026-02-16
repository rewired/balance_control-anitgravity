import { describe, expect, it } from 'vitest';
import { EngineModuleRegistry } from '../src/engine/engine-module-registry';

describe('EngineModuleRegistry', () => {
    it('rejects duplicate atom.kind registration with deterministic ordering', () => {
        const reg = new EngineModuleRegistry(['core', 'exp02'] as any);

        reg.registerModule({
            id: 'core',
            isEnabled: () => true,
            atoms: [
                { kind: 'atom.b', handler: () => {} },
                { kind: 'atom.a', handler: () => {} }
            ]
        });

        reg.registerModule({
            id: 'exp02',
            isEnabled: () => true,
            atoms: [
                { kind: 'atom.a', handler: () => {} },
                { kind: 'atom.b', handler: () => {} }
            ]
        });

        expect(() => reg.buildAtomDispatch({ meta: { cfg: { expansions: { ex02: true } } } } as any)).toThrowError(
            [
                'EngineModuleRegistry: duplicate atom.kind registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "atom.a" but it is already registered by core',
                '- exp02 registers "atom.b" but it is already registered by core'
            ].join('\n')
        );
    });
});

