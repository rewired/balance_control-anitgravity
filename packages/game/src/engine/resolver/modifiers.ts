import type { GameState } from '@balance-control/rules';
import type { EffectAtom, HookPoint, EngineState } from '../types';
import { evaluateTileSelector } from '../selectors';

/**
 * Removes a modifier from the engine state.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function removeModifier(G: GameState & { engine: EngineState }, id: string): void {
    G.engine.activeModifiers = G.engine.activeModifiers.filter(m => m.id !== id);
}

/**
 * Find all modifiers matching the current hook and context, and trigger them.
 * @remarks Stacking order follows priority; Regulations resolve in order: Blockade (1), Costs (2), Output (3).
 * @expansion EXP-02
 * @deterministic
 * @sideEffects
 * @rule EXP-02-04-B
 */
export function applyModifiers(
    G: GameState & { engine: EngineState },
    _ctx: any,
    hook: HookPoint,
    currentAtom: EffectAtom
): void {
    const modifiers = G.engine.activeModifiers
        .filter(m => m.hook === hook)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const mod of modifiers) {
        // Check context suitability (Player/Tile)
        if (mod.playerId && mod.playerId !== (currentAtom as any).playerId) continue;
        if (mod.targetTileId && mod.targetTileId !== (currentAtom as any).targetTileId) continue;

        if (mod.selector) {
            const targetId = (currentAtom as any).targetTileId || (currentAtom as any).tileId;
            if (targetId && !evaluateTileSelector(mod.selector, targetId, G)) continue;
        }

        // Trigger the modifier's effect by prepending to the queue
        // This allows recursive/cascading effects (e.g., "M02 adds cost to Action")
        G.engine.effectQueue.unshift(mod.effect);

        // Handle consumption
        if (mod.expiry === 'consumed' || mod.consumeRule === 'once') {
            removeModifier(G, mod.id);
        }
    }
}

/**
 * Maps an atom kind to its corresponding hook point.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function getHookForAtom(atom: EffectAtom): string | null {
    if (atom.kind === 'resource.pay') return 'PayCost';
    if (atom.kind === 'resource.grant') return 'Grant';
    if (atom.kind.startsWith('influence.')) return 'Action';
    if (atom.kind.startsWith('tile.')) return 'Action';
    return null;
}

