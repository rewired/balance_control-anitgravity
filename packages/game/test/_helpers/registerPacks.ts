import type { EnginePackDefinition } from '../../src/packs/types';
import { EnginePackRegistry } from '../../src/expansion-registry';
import { CorePack } from '../../src/packs/core';
import { CoreMoves } from '../../src/moves';

export function registerTestPacks(packs: EnginePackDefinition[] = []): void {
    EnginePackRegistry.clear();
    const coreAlreadyRegistered = EnginePackRegistry.getRegisteredPacks().some((pack) => pack.id === 'core');
    if (!coreAlreadyRegistered) {
        EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves });
    }
    for (const pack of packs) {
        EnginePackRegistry.registerPack(pack);
    }
}
