import { CorePack, createBalanceControlGame, EnginePackRegistry, Exp01Pack, Exp02Pack, Exp03Pack } from '@balance-control/game';

export function registerBotPacks(): void {
    const registeredPackIds = new Set(EnginePackRegistry.getRegisteredPacks().map((pack) => pack.id));
    if (!registeredPackIds.has('core')) {
        EnginePackRegistry.registerPack(CorePack);
    }
    if (!registeredPackIds.has('exp01')) {
        EnginePackRegistry.registerPack(Exp01Pack);
    }
    if (!registeredPackIds.has('exp02')) {
        EnginePackRegistry.registerPack(Exp02Pack);
    }
    if (!registeredPackIds.has('exp03')) {
        EnginePackRegistry.registerPack(Exp03Pack);
    }
}

export function createBotGame(): ReturnType<typeof createBalanceControlGame> {
    registerBotPacks();
    return createBalanceControlGame();
}
