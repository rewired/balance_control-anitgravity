import { describe, expect, it } from 'vitest';
import { MoveModuleRegistry } from '../src/move-module-registry';

describe('MoveModuleRegistry', () => {
    it('rejects duplicate move registrations with deterministic ordering', () => {
        const reg = new MoveModuleRegistry(['core', 'exp01', 'exp02'] as any);

        reg.registerModule({
            moduleId: 'core',
            moves: {
                'move.b': () => {},
                'move.a': () => {},
            },
        } as any);

        reg.registerModule({
            moduleId: 'exp01',
            moves: {
                'move.a': () => {},
                'move.c': () => {},
            },
        } as any);

        reg.registerModule({
            moduleId: 'exp02',
            moves: {
                'move.b': () => {},
                'move.a': () => {},
            },
        } as any);

        expect(() => reg.buildMoveMap()).toThrowError(
            [
                'MoveModuleRegistry: duplicate move registrations are forbidden.',
                'Conflicts:',
                '- exp01 registers "move.a" but it is already registered by core',
                '- exp02 registers "move.a" but it is already registered by core',
                '- exp02 registers "move.b" but it is already registered by core',
            ].join('\n')
        );
    });
});

