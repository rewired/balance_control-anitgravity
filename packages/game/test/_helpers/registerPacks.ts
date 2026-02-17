import type { ExpansionDefinition } from '@balance-control/rules';
import type { EnginePackDefinition } from '../../src/packs/types';
import { EnginePackRegistry, packFromExpansionDefinition } from '../../src/expansion-registry';
import { CorePack } from '../../src/packs/core';
import { CoreMoves } from '../../src/moves';

type TestPackInput = EnginePackDefinition | ExpansionDefinition;

export function registerTestPacks(packs: TestPackInput[] = []): void {
    EnginePackRegistry.clear();
    const coreAlreadyRegistered = EnginePackRegistry.getRegisteredPacks().some((pack) => pack.id === 'core');
    if (!coreAlreadyRegistered) {
        EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves });
    }
    for (const pack of packs) {
        if ('manifest' in pack) {
            EnginePackRegistry.registerPack(pack);
        } else {
            EnginePackRegistry.registerPack(packFromExpansionDefinition(pack));
        }
    }
}
