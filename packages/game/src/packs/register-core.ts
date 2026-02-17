import { EnginePackRegistry } from '../expansion-registry';
import { CorePack } from './core';

export function ensureCorePackRegistered(): void {
    const alreadyRegistered = EnginePackRegistry.getRegisteredPacks().some((p) => p.id === 'core');
    if (alreadyRegistered) return;
    EnginePackRegistry.registerPack(CorePack);
}

