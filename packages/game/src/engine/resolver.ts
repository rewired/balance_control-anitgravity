import { GameState } from '@balance-control/rules';
import { EffectAtom, ActiveModifier, HookPoint, EngineState } from './types';
import { evaluateTileSelector } from './selectors';
import { computeMajority } from '../mechanics';
import { ExpansionRegistry } from '../expansion-registry';

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

        // 2. Main Logic
        switch (atom.kind) {
            case 'resource.pay':
                this.handleResourcePay(G, atom);
                break;
            case 'resource.grant':
                this.handleResourceGrant(G, atom);
                break;
            case 'production.resolve':
                this.handleProductionResolve(G, atom);
                break;
            case 'measure.play':
                this.handleMeasurePlay(G, atom);
                break;
            case 'influence.place':
                this.handleInfluencePlace(G, atom);
                break;
            case 'influence.formalize':
                this.handleInfluenceFormalize(G, atom);
                break;
            case 'influence.move':
                this.handleInfluenceMove(G, atom);
                break;
            case 'choice.request':
                G.engine.pendingChoice = {
                    ...atom.choice,
                    resumeToken: Math.random().toString(36).substr(2, 9)
                };
                break;

            case 'choice.apply':
                this.handleChoiceApply(G, ctx, atom);
                break;

            case 'modifier.add':
                G.engine.activeModifiers.push(atom.modifier);
                break;

            case 'modifier.remove':
                this.removeModifier(G, atom.sourceId);
                break;
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
                this.removeModifier(G, mod.id);
            }
        }
    }

    private static getHookForAtom(atom: EffectAtom): string | null {
        if (atom.kind === 'resource.pay') return 'PayCost';
        if (atom.kind === 'resource.grant') return 'Grant';
        if (atom.kind.startsWith('influence.')) return 'Action';
        if (atom.kind.startsWith('tile.')) return 'Action';
        return null;
    }

    private static handleResourcePay(G: GameState, atom: any): void {
        const { playerId, amount, resorts } = atom;
        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];
        const bank = G.zones['Bank'];

        if (!supply || !bank) return;

        let count = 0;
        for (let i = supply.items.length - 1; i >= 0 && count < amount; i--) {
            const rid = supply.items[i];
            const obj = G.objects[rid];
            if (obj && obj.type === 'Resource' && (resorts === 'ANY' || resorts.includes(obj.resort!))) {
                supply.items.splice(i, 1);
                bank.items.push(rid);
                obj.owner = undefined;
                count++;
            }
        }
    }

    private static handleResourceGrant(G: GameState, atom: any): void {
        let { playerId, amount, resort, context } = atom;

        if (amount === 'CONTEXT_BASE' && context?.baseAmount !== undefined) {
            amount = context.baseAmount;
        }
        if (resort === 'CONTEXT_RESORT' && context?.resort) {
            resort = context.resort;
        }

        if (playerId === 'CONTROLLER' && context?.tileId) {
            const { controller } = computeMajority(context.tileId, G);
            if (controller) {
                playerId = controller;
            } else {
                playerId = 'NOISE'; // Split logic not handled here yet for simplicity
            }
        }

        const supplyId = playerId === 'NOISE' ? 'Noise' : `PersonalSupply:${playerId}`;
        const targetZone = G.zones[supplyId];
        const bank = G.zones['Bank'];

        if (!targetZone || !bank) return;

        if (amount >= 0) {
            for (let k = 0; k < amount; k++) {
                const bankIdx = bank.items.findIndex(id => G.objects[id]?.resort === resort);
                if (bankIdx >= 0) {
                    const rid = bank.items.splice(bankIdx, 1)[0];
                    targetZone.items.push(rid);
                    if (G.objects[rid]) G.objects[rid].owner = playerId === 'NOISE' ? undefined : playerId;
                } else {
                    const rid = `res_${resort}_${Date.now()}_${Math.random()}`;
                    G.objects[rid] = { id: rid, type: 'Resource', owner: playerId === 'NOISE' ? undefined : playerId, resort };
                    targetZone.items.push(rid);
                }
            }
        } else {
            // Negative grant = Removal (Reduction)
            const countToRemove = Math.abs(amount);
            let removed = 0;
            for (let i = targetZone.items.length - 1; i >= 0 && removed < countToRemove; i--) {
                const rid = targetZone.items[i];
                const obj = G.objects[rid];
                if (obj && obj.type === 'Resource' && obj.resort === resort) {
                    targetZone.items.splice(i, 1);
                    bank.items.push(rid);
                    obj.owner = undefined;
                    removed++;
                }
            }
        }
    }

    private static handleInfluencePlace(G: GameState & { engine: EngineState }, atom: any): void {
        this.applyModifiers(G, null, 'beforeAction', atom);
        const { playerId, targetTileId } = atom;
        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];
        const targetZone = G.zones[targetTileId];

        const idx = supply.items.findIndex(id => G.objects[id]?.type === 'Influence');
        if (idx >= 0) {
            const iid = supply.items.splice(idx, 1)[0];
            targetZone.items.push(iid);
        }
    }

    private static handleInfluenceFormalize(G: GameState & { engine: EngineState }, atom: any): void {
        this.applyModifiers(G, null, 'beforeAction', atom);
        const { playerId } = atom;
        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];

        // CORE-01-04-17: Create exactly one new Influence
        const infId = `inf_${playerId}_form_${Date.now()}`;
        G.objects[infId] = { id: infId, type: 'Influence', owner: playerId };
        supply.items.push(infId);
    }

    private static handleInfluenceMove(G: GameState & { engine: EngineState }, atom: any): void {
        this.applyModifiers(G, null, 'beforeAction', atom);
        const { playerId, sourceTileId, targetTileId } = atom;
        const srcZone = G.zones[sourceTileId];
        const dstZone = G.zones[targetTileId];

        const idx = srcZone.items.findIndex(id => G.objects[id]?.owner === playerId && G.objects[id].type === 'Influence');
        if (idx >= 0) {
            const iid = srcZone.items.splice(idx, 1)[0];
            dstZone.items.push(iid);
        }
    }

    private static handleProductionResolve(G: GameState & { engine: EngineState }, atom: any): void {
        const { tileId } = atom;
        const tile = G.tiles[tileId];
        if (!tile || tile.type !== 'Resort' || !tile.resort) return;

        const baseAmount = tile.weight || 0;
        atom.context = { ...atom.context, tileId, baseAmount, resort: tile.resort };

        // 1. Trigger hooks that might add or subtract from this distribution
        this.applyModifiers(G, null, 'onProduction', atom);

        // 2. Grant the base printed amount - unshift LAST so it is at the FRONT
        G.engine.effectQueue.unshift({
            kind: 'resource.grant',
            playerId: 'CONTROLLER',
            amount: baseAmount,
            resort: tile.resort,
            context: { tileId, source: 'production', baseAmount }
        });
    }

    private static handleMeasurePlay(G: GameState & { engine: EngineState }, atom: any): void {
        const { playerId, measureObjectId } = atom;
        const obj = G.objects[measureObjectId];
        if (!obj || obj.type !== 'Measure') return;

        const mId = obj.measureId;
        if (!mId) return;

        const atoms = ExpansionRegistry.getMeasureAtoms(G, mId, atom);
        if (atoms && atoms.length > 0) {
            G.engine.effectQueue.unshift(...atoms);
        }

        // Standard Recycle (simplified for engine)
        const handId = `PlayerHand:${playerId}`;
        const hand = G.zones[handId];
        if (hand) {
            const idx = hand.items.indexOf(measureObjectId);
            if (idx >= 0) hand.items.splice(idx, 1);
        }

        obj.playCount = (obj.playCount || 0) + 1;
        obj.owner = undefined;
        const recycleZone = obj.playCount === 1 ? 'MeasureRecyclePile' : 'MeasureFinalDiscard';
        if (G.zones[recycleZone]) {
            G.zones[recycleZone].items.push(measureObjectId);
        }
    }
    private static handleChoiceApply(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
        const { selection, context } = atom;
        if (context?.followUp) {
            const followUpAtoms = context.followUp[selection];
            if (followUpAtoms) {
                // Add follow-up atoms to the FRONT of the queue to prioritize them
                G.engine.effectQueue.unshift(...followUpAtoms);
            }
        }
    }

    private static removeModifier(G: GameState & { engine: EngineState }, id: string): void {
        G.engine.activeModifiers = G.engine.activeModifiers.filter(m => m.id !== id);
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
