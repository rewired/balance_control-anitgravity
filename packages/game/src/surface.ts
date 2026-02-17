import type { GameConfig, GameState } from '@balance-control/rules';
import { EnginePackRegistry } from './expansion-registry';
import { hashState } from './hash-state';
import { assemblePacks } from './move-assembly';
import type { AtomRegistration } from './engine/engine-module-registry';

export type PackManifestRecord = Readonly<{
    id: string;
    packVersion: string;
    rulesetAnchor: string;
}>;

export type PublicSurface = Readonly<{
    packs: PackManifestRecord[];
    moveIds: string[];
    atomIds: string[];
}>;

export function getPublicSurface(config: GameConfig): PublicSurface {
    const enabledPacks = EnginePackRegistry.getEnabledPacks(undefined, config);
    const packs: PackManifestRecord[] = enabledPacks.map((pack) => ({
        id: pack.manifest.id,
        packVersion: pack.manifest.packVersion,
        rulesetAnchor: pack.manifest.rulesetAnchor,
    }));

    const moves = assemblePacks({ config, mode: 'enabled' }).moves;
    const moveIds = Object.keys(moves).sort((a, b) => a.localeCompare(b));

    const atomRegistrations: AtomRegistration[] = [];
    const triggerHook = () => undefined;
    for (const pack of enabledPacks) {
        const atoms = pack.engine?.atoms?.({ triggerHook }) ?? [];
        atomRegistrations.push(...atoms);
    }
    const atomIds = Array.from(new Set(atomRegistrations.map((atom) => atom.kind))).sort((a, b) => a.localeCompare(b));

    return { packs, moveIds, atomIds };
}

export function getPublicSurfaceHash(config: GameConfig): string {
    return hashState(getPublicSurface(config));
}

export function validateSurfaceHash(state: GameState): void {
    const loadedHash = state.meta?.publicSurfaceHash;
    if (!loadedHash) {
        return;
    }
    const cfg = state.meta?.cfg;
    if (!cfg) {
        return;
    }
    const currentHash = getPublicSurfaceHash(cfg);
    if (currentHash !== loadedHash) {
        throw new Error(
            `Engine and game state mismatch. The game was created with a public surface hash '${loadedHash}', but the current engine's hash is '${currentHash}'. This is likely due to a version change in the game rules or expansions.`,
        );
    }
}
