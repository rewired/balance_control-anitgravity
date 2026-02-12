import { GameState } from '@balance-control/rules';
import { EffectAtom, ActiveModifier, HookPoint, EngineState } from './types';
import { evaluateTileSelector } from './selectors';

/**
 * The EffectResolver is the central "CPU" of the game.
 * It processes instructions (Atoms) and applies reactive rules (Modifiers).
 */
export class EffectResolver {
    /**
     * Entry point: Run the effect queue until empty or paused by choice.
     */
    static resolve(G: GameState & { engine: EngineState }, ctx: any): void {
        const engine = G.engine;

        while (engine.effectQueue.length > 0 && !engine.pendingChoice) {
            const atom = engine.effectQueue.shift()!;
            this.execute(G, ctx, atom);
        }
    }

    /**
     * Execute a single atom, applying relevant modifiers before/after.
     */
    private static execute(G: GameState & { engine: EngineState }, ctx: any, atom: EffectAtom): void {
        const hook = this.getHookForAtom(atom);

        // 1. Apply "before" modifiers
        if (hook) {
            this.applyModifiers(G, ctx, `before${capitalize(hook)}` as HookPoint, atom);
        }

        // 2. Main Logic (Simplified for the skeleton)
        // Transitioning from imperative mechanics to this central loop
        switch (atom.kind) {
            case 'choice.request':
                G.engine.pendingChoice = {
                    ...atom.choice,
                    resumeToken: Math.random().toString(36).substr(2, 9)
                };
                break;

            case 'modifier.add':
                G.engine.activeModifiers.push(atom.modifier);
                break;

            case 'modifier.remove':
                G.engine.activeModifiers = G.engine.activeModifiers.filter(m => m.sourceId !== atom.sourceId);
                break;

            // ... Other atom implementations will be called here ...
            // e.g., this.handleResourceAction(G, atom);
        }

        // 3. Apply "after" modifiers
        if (hook) {
            this.applyModifiers(G, ctx, `after${capitalize(hook)}` as HookPoint, atom);
        }

        // Log to history
        G.engine.history.push({
            tick: G.engine.history.length,
            atom: atom.kind,
            ts: Date.now()
        });
    }

    /**
     * Find all modifiers matching the current hook and context, and trigger them.
     */
    private static applyModifiers(G: GameState & { engine: EngineState }, ctx: any, hook: HookPoint, currentAtom: EffectAtom): void {
        const modifiers = G.engine.activeModifiers.filter(m => m.hook === hook);

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
                this.removeModifier(G, mod.id);
            }
        }
    }

    private static getHookForAtom(atom: EffectAtom): string | null {
        if (atom.kind.startsWith('resource.')) return 'PayCost';
        if (atom.kind.startsWith('influence.')) return 'Action';
        if (atom.kind.startsWith('tile.')) return 'Action';
        return null;
    }

    private static removeModifier(G: GameState & { engine: EngineState }, id: string): void {
        G.engine.activeModifiers = G.engine.activeModifiers.filter(m => m.id !== id);
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
