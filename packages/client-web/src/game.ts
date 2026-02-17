import { CorePack, createBalanceControlGame, EnginePackRegistry } from '@balance-control/game';
import { Expansion01 } from '@balance-control/expansion-01';
import { Expansion02 } from '@balance-control/expansion-02';
import { Expansion03 } from '@balance-control/expansion-03';

const registeredPackIds = new Set(EnginePackRegistry.getRegisteredPacks().map((pack) => pack.id));
if (!registeredPackIds.has('core')) {
    EnginePackRegistry.registerPack(CorePack);
}
if (!registeredPackIds.has('exp01')) {
    EnginePackRegistry.register(Expansion01);
}
if (!registeredPackIds.has('exp02')) {
    EnginePackRegistry.register(Expansion02);
}
if (!registeredPackIds.has('exp03')) {
    EnginePackRegistry.register(Expansion03);
}

export const BalanceControlGame = createBalanceControlGame();
export const GAME_NAME = BalanceControlGame.name;
