import {
    EnginePackRegistry,
    CANONICAL_ENGINE_MODULE_ORDER,
    type EnginePackDefinition
} from '@balance-control/game';
import { CorePack } from '@balance-control/core';

import { Exp01Pack } from './exp01';
import { Exp02Pack } from './exp02';
import { Exp03Pack } from './exp03';

export { CorePack, Exp01Pack, Exp02Pack, Exp03Pack };

const PACK_MAP: Record<string, EnginePackDefinition> = {
    'core': CorePack,
    'exp01': Exp01Pack,
    'exp02': Exp02Pack,
    'exp03': Exp03Pack
};

/**
 * Registers all canonical packs (Core + Exp01/02/03) to the provided registry (or default).
 * Safe to call multiple times (idempotent).
 * @param registry Optional registry instance (defaults to singleton).
 */
export function registerCanonicalPacks(registry: typeof EnginePackRegistry = EnginePackRegistry) {
    const registeredIds = new Set(registry.getRegisteredPacks().map(p => p.id));

    for (const id of CANONICAL_ENGINE_MODULE_ORDER) {
        if (!registeredIds.has(id)) {
            const pack = PACK_MAP[id];
            if (pack) {
                registry.registerPack(pack);
            }
        }
    }
}
