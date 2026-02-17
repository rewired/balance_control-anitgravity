import { EnginePackRegistry } from '../expansion-registry';

export function ensureCorePackRegistered(): void {
    const corePack = EnginePackRegistry.getRegisteredPacks().find((p) => p.id === 'core');
    if (corePack && corePack.moves && Object.keys(corePack.moves).length > 0) return;
    throw new Error('Core pack not registered. Register CorePack before calling createBalanceControlGame().');
}
