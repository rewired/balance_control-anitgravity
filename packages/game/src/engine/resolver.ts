import { GameState } from '@balance-control/rules';
import { EffectAtom, HookPoint, EngineState } from './types';
import type { AtomHandler } from './engine-module-registry';
import { capitalize } from './resolver/ids';
import { applyModifiers, getHookForAtom, removeModifier } from './resolver/modifiers';
import { isProhibited as isProhibitedImpl } from './resolver/prohibitions';
import {
    checkAndPayCosts as checkAndPayCostsImpl,
    commitCost as commitCostImpl,
    getExtraCostSlots as getExtraCostSlotsImpl,
    validateCost as validateCostImpl,
    type CostSlot,
    type CostSpec,
    type CostValidationResult
} from './resolver/costs';
import { assemblePacks } from '../move-assembly';

/**
 * The EffectResolver is the central "CPU" of the game.
 * It processes instructions (Atoms) and applies reactive rules (Modifiers).
 */
export class EffectResolver {
    private static readonly TURN_SCOPED_USAGE_ACTIONS = [
        'politicalAction',
        'measure.play',
        'measure.hold'
    ];

    /**
     * Entry point: Run the effect queue until empty or paused by choice.
     */
    public static triggerHook(G: GameState & { engine: EngineState }, ctx: any, hook: HookPoint, payload?: any): void {
        const modifiers = G.engine.activeModifiers
            .filter(m => m.hook === hook)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const mod of modifiers) {
            // Context checks
            if (mod.playerId && mod.playerId !== payload?.playerId) continue;
            if (mod.targetTileId && mod.targetTileId !== payload?.targetTileId) continue;

            G.engine.effectQueue.unshift(mod.effect);

            if (mod.expiry === 'consumed' || mod.consumeRule === 'once') {
                removeModifier(G, mod.id);
            }
        }

        this.resolve(G, ctx);
    }

    public static isProhibited(G: GameState & { engine: EngineState }, actionType: string, playerId: string, tileId?: string): boolean {
        return isProhibitedImpl(G, actionType, playerId, tileId);
    }

    public static checkUsageLimit(G: GameState & { engine: EngineState }, actionType: string, playerId: string): boolean {
        const limits = G.engine.attributes.limits || {};
        const usage = G.engine.attributes.usage || {};

        const limit = limits[actionType] ?? Infinity;
        const playerUsage = usage[playerId]?.[actionType] || 0;
        const globalUsage = usage[actionType] || 0;

        if (playerUsage >= limit) return false;
        // Some limits might be global per round
        const globalLimit = limits[`global:${actionType}`] ?? Infinity;
        if (globalUsage >= globalLimit) return false;

        return true;
    }

    public static incrementUsage(G: GameState & { engine: EngineState }, actionType: string, playerId: string): void {
        if (!G.engine.attributes.usage) G.engine.attributes.usage = {};
        const usage = G.engine.attributes.usage;

        if (!usage[playerId]) usage[playerId] = {};
        usage[playerId][actionType] = (usage[playerId][actionType] || 0) + 1;
        usage[actionType] = (usage[actionType] || 0) + 1;
    }

    public static resetTurnScopedUsage(G: GameState & { engine: EngineState }, playerId: string): void {
        const usage = G.engine.attributes.usage;
        if (!usage) return;

        const playerUsage = usage[playerId];
        if (!playerUsage || typeof playerUsage !== 'object') return;

        for (const actionType of this.TURN_SCOPED_USAGE_ACTIONS) {
            const usedCount = playerUsage[actionType] || 0;
            if (usedCount > 0) {
                if (typeof usage[actionType] === 'number') {
                    usage[actionType] = Math.max(0, usage[actionType] - usedCount);
                    if (usage[actionType] === 0) {
                        delete usage[actionType];
                    }
                }
                delete playerUsage[actionType];
            }
        }

        if (Object.keys(playerUsage).length === 0) {
            delete usage[playerId];
        }
    }

    public static resetRoundScopedUsage(G: GameState & { engine: EngineState }): void {
        const usage = G.engine.attributes.usage;
        if (!usage) return;

        for (const actionType of this.TURN_SCOPED_USAGE_ACTIONS) {
            delete usage[actionType];
        }
    }

    public static validateCost(
        G: GameState & { engine: EngineState },
        _ctx: any,
        costSpec: CostSpec
    ): CostValidationResult {
        return validateCostImpl(G, _ctx, costSpec);
    }

    public static commitCost(
        G: GameState & { engine: EngineState },
        _ctx: any,
        costSpec: CostSpec & { resourceIds: string[] }
    ): boolean {
        return commitCostImpl(G, _ctx, costSpec);
    }

    public static getExtraCostSlots(
        G: GameState & { engine: EngineState },
        pid: string,
        actionType: string,
        tileId?: string,
        options?: { includePingPongPenalty?: boolean }
    ): CostSlot[] {
        return getExtraCostSlotsImpl(G, pid, actionType, tileId, options);
    }

    public static checkAndPayCosts(
        G: GameState & { engine: EngineState },
        pid: string,
        actionType: string,
        tileId?: string,
        extraResourceIds?: string[],
        options?: { includePingPongPenalty?: boolean }
    ): boolean {
        return checkAndPayCostsImpl(G, pid, actionType, tileId, extraResourceIds, options);
    }

    public static resolve(G: GameState & { engine: EngineState }, ctx: any): boolean {
        const engine = G.engine;
        let ok = true;
        const dispatch = this.buildAtomDispatch(G);

        while (engine.effectQueue.length > 0 && !engine.pendingChoice) {
            const atom = engine.effectQueue.shift()!;
            ok = this.execute(G, ctx, atom, dispatch);
            if (!ok) {
                engine.effectQueue = [];
                break;
            }
        }

        return ok;
    }

    /**
     * Execute a single atom, applying relevant modifiers before/after.
     */
    private static execute(
        G: GameState & { engine: EngineState },
        ctx: any,
        atom: EffectAtom,
        dispatch: ReadonlyMap<string, AtomHandler>
    ): boolean {
        const hook = getHookForAtom(atom);

        // 1. Apply "before" modifiers
        if (hook) {
            applyModifiers(G, ctx, `before${capitalize(hook)}` as HookPoint, atom);
        }

        // 2. Main Logic
        const handler = dispatch.get(atom.kind);
        if (handler) {
            const result = handler(G as any, ctx, atom as any);
            if (result === false) return false;
        }

        // 3. Apply "after" modifiers
        if (hook) {
            applyModifiers(G, ctx, `after${capitalize(hook)}` as HookPoint, atom);
        }

        // Log to history
        G.engine.history.push({
            seq: G.engine.history.length,
            atom: atom.kind
        });

        return true;
    }

    private static buildAtomDispatch(G: GameState & { engine: EngineState }): ReadonlyMap<string, AtomHandler> {
        const assembly = assemblePacks({ config: G.meta?.cfg as any, mode: 'enabled' });
        return assembly.buildAtomDispatch(G, (G2, ctx2, hook, payload) => this.triggerHook(G2 as any, ctx2, hook, payload));
    }
}
