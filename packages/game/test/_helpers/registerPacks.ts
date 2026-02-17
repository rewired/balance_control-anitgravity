import type { ExpansionDefinition } from '@balance-control/rules';
import { EnginePackRegistry, ExpansionRegistry } from '../../src/expansion-registry';
import { CorePack } from '../../src/packs/core';

export function registerTestPacks(expansions: ExpansionDefinition[] = []): void {
    ExpansionRegistry.clear();
    const coreAlreadyRegistered = EnginePackRegistry.getRegisteredPacks().some((pack) => pack.id === 'core');
    if (!coreAlreadyRegistered) {
        EnginePackRegistry.registerPack(CorePack);
    }
    for (const expansion of expansions) {
        ExpansionRegistry.register(expansion);
    }
}
