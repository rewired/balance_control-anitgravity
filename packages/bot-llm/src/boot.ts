import { CorePack, createBalanceControlGame, EnginePackRegistry, packFromExpansionDefinition } from '@balance-control/game';
import { Expansion01 } from '@balance-control/expansion-01';
import { Expansion02 } from '@balance-control/expansion-02';
import { Expansion03 } from '@balance-control/expansion-03';

export function registerBotPacks(): void {
    const registeredPackIds = new Set(EnginePackRegistry.getRegisteredPacks().map((pack) => pack.id));
    if (!registeredPackIds.has('core')) {
        EnginePackRegistry.registerPack(CorePack);
    }
    if (!registeredPackIds.has('exp01')) {
        EnginePackRegistry.registerPack(packFromExpansionDefinition(Expansion01));
    }
    if (!registeredPackIds.has('exp02')) {
        EnginePackRegistry.registerPack(packFromExpansionDefinition(Expansion02));
    }
    if (!registeredPackIds.has('exp03')) {
        EnginePackRegistry.registerPack(packFromExpansionDefinition(Expansion03));
    }
}

export function createBotGame() {
    registerBotPacks();
    return createBalanceControlGame();
}
