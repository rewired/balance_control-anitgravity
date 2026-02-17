import { GameConfig, GameState } from './types';
import { EnginePackRegistry }from './expansion-registry';
import { mergeMoveModules } from './move-assembly';
import { hashState } from './hash-state';
import { AtomRegistration } from './engine/types';

/**
 * A serializable record of a pack's manifest, stored in the game state.
 * @rule ARCH-01:REPLAY_SAFETY
 */
export interface PackManifestRecord {
  id: string;
  packVersion: string;
  rulesetAnchor: string;
}

/**
 * The public surface of the game engine for a given configuration.
 * This object is hashed to ensure replay safety.
 * @rule ARCH-01:REPLAY_SAFETY
 */
export interface PublicSurface {
  packs: PackManifestRecord[];
  moveIds: string[];
  atomIds: string[];
}

/**
 * Computes the public surface of the game for a given configuration.
 * The surface includes enabled pack manifests, and sorted lists of move and atom IDs.
 * @param config The game configuration.
 * @returns A deterministic public surface object.
 * @deterministic
 * @pure
 */
export function getPublicSurface(config: GameConfig): PublicSurface {
  const enabledPacks = EnginePackRegistry.getEnabledPacks(undefined, config);
  const moveModules = EnginePackRegistry.getEnabledMoveModules(config);
  const moves = mergeMoveModules(moveModules);

  const atomRegistrations: AtomRegistration[] = [];
  const dummyTriggerHook = () => {
    /* no-op for surface calculation */
  };
  for (const pack of enabledPacks) {
    if (pack.engine?.atoms) {
      atomRegistrations.push(...pack.engine.atoms({ triggerHook: dummyTriggerHook }));
    }
  }

  return {
    packs: enabledPacks.map((p) => p.manifest),
    moveIds: Object.keys(moves).sort(),
    atomIds: atomRegistrations.map((a) => a.id).sort(),
  };
}

/**
 * Validates that the provided game state's surface hash matches the current engine's surface hash.
 * Throws an error on mismatch.
 * @param state The game state to validate.
 * @sideEffects Throws an error if validation fails.
 */
export function validateSurfaceHash(state: GameState): void {
  const loadedHash = state.meta.publicSurfaceHash;
  if (!loadedHash) {
    // Legacy state from before surface hashing was introduced; cannot validate.
    return;
  }

  const currentSurface = getPublicSurface(state.meta.cfg);
  const currentHash = hashState(currentSurface);

  if (currentHash !== loadedHash) {
    throw new Error(
      `Engine and game state mismatch. The game was created with a public surface hash '${loadedHash}', but the current engine's hash is '${currentHash}'. This is likely due to a version change in the game rules or expansions.`,
    );
  }
}
