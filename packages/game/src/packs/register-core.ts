import { EnginePackRegistry } from '../expansion-registry';

/**
 * Ensures that the core pack is registered.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function ensureCorePackRegistered(): void {
    const corePack = EnginePackRegistry.getRegisteredPacks().find((p) => p.id === 'core');
    if (corePack && corePack.moves && Object.keys(corePack.moves).length > 0) return;
    throw new Error('Core pack not registered. Register CorePack before calling createBalanceControlGame().');
}
