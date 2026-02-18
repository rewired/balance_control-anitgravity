import type { EnginePackDefinition, EnginePackId } from '../../src/packs/types';

/**
 * Creates a minimal valid EnginePackDefinition for testing purposes.
 * Automatically ensures manifest.id matches the top-level id.
 */
export function makeTestPack(overrides: Partial<EnginePackDefinition> & { id: EnginePackId }): EnginePackDefinition {
    const id = overrides.id;
    return {
        id,
        name: overrides.name ?? `Test Pack ${id}`,
        manifest: {
            id,
            packVersion: '0.0.0',
            rulesetAnchor: `TEST-${id.toUpperCase()} v0.0.0`,
            required: false,
            ...overrides.manifest,
        },
        ...overrides,
    };
}
