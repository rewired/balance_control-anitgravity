import type { EnginePackDefinition } from '@balance-control/game';
import { EnginePackRegistry } from '@balance-control/game';
import { CorePack } from '../../src/engine';
import { CoreMoves } from '../../src/moves';

type TestPackInput = EnginePackDefinition;

export function registerTestPacks(packs: TestPackInput[] = []): void {
    EnginePackRegistry.clear();
    const coreAlreadyRegistered = EnginePackRegistry.getRegisteredPacks().some((pack) => pack.id === 'core');
    if (!coreAlreadyRegistered) {
        EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves });

        const registeredCore = EnginePackRegistry
            .getRegisteredPacks()
            .find((pack) => pack.id === 'core');

        const coreMoveKeys = Object.keys(registeredCore?.moves ?? {});
        if (!registeredCore || coreMoveKeys.length === 0) {
            throw new Error(
                '[registerTestPacks] Hard precondition failed: expected registered core pack with non-empty moves after core registration.',
            );
        }
    }
    for (const pack of packs) {
        EnginePackRegistry.registerPack(pack);
    }
}
