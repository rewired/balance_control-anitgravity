import type { GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine-module-registry';
import type { EngineState } from '../types';
import { computeMajority } from '../../mechanics';
import { applyModifiers } from '../resolver/modifiers';
import { isProhibited } from '../resolver/prohibitions';

function handleHotspotResolve(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
    const { tileId } = atom;
    const tile = G.tiles[tileId];
    if (!tile) return;

    // CORE-01-06-03B: Single-Resolution Invariant — skip if already resolved
    const resolved = G.engine.attributes.resolvedHotspots ?? [];
    if (resolved.includes(tileId)) return;

    // 1. Prohibitions & Modifiers
    if (isProhibited(G, 'hotspot.resolve', 'NONE', tileId)) return;
    applyModifiers(G, ctx, 'beforeAction', atom);

    // 2. Determine Majority
    const { controller } = computeMajority(tileId, G);
    if (controller) {
        // Emit influence placement
        G.engine.effectQueue.unshift({
            kind: 'influence.place',
            playerId: controller,
            targetTileId: tileId,
            context: { source: 'hotspot.resolve', tileId }
        });
    }

    // CORE-01-06-03B: Mark Hotspot as resolved
    if (!G.engine.attributes.resolvedHotspots) G.engine.attributes.resolvedHotspots = [];
    G.engine.attributes.resolvedHotspots.push(tileId);

    applyModifiers(G, ctx, 'afterAction', atom);
}

export const coreHotspotAtoms: AtomRegistration[] = [
    { kind: 'hotspot.resolve', handler: (G, ctx, atom) => handleHotspotResolve(G as any, ctx, atom) }
];

