import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnginePackRegistry } from '../../src/expansion-registry';
import { registerTestPacks } from './registerPacks';

describe('registerTestPacks', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('registers core pack with non-empty moves', () => {
        registerTestPacks();

        const corePack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.id === 'core');
        expect(corePack).toBeDefined();
        expect(Object.keys(corePack?.moves ?? {})).not.toHaveLength(0);
    });
});
