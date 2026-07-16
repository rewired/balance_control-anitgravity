import { EnginePackRegistry } from './expansion-registry';

/**
 * Ensures that the required (root) pack is registered with at least one move.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function ensureRequiredPackRegistered(): void {
    const requiredPack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.manifest.required);
    if (requiredPack && requiredPack.moves && Object.keys(requiredPack.moves).length > 0) return;
    throw new Error('Required pack not registered. Register the required pack (e.g. CorePack) before calling createBalanceControlGame().');
}
