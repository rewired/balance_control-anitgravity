import { GameState } from '@balance-control/rules';
import { EffectAtom, ActiveModifier, HookPoint, EngineState } from './types';
import { evaluateTileSelector } from './selectors';
import { computeMajority } from '../mechanics';
import { countPlayerInfluence, getInfluenceCap } from '../mechanics-turn';
import { ExpansionRegistry } from '../expansion-registry';

type CostSlot = string[] | 'ANY';

interface CostSpec {
    playerId: string;
    slots: CostSlot[];
    resourceIds?: string[];
    allowSubstitutions?: boolean;
}

type CostValidationResult =
    | { ok: true; resourceIds: string[] }
    | { ok: false; error: string };

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
                this.removeModifier(G, mod.id);
            }
        }

        this.resolve(G, ctx);
    }
    public static isProhibited(G: GameState & { engine: EngineState }, actionType: string, playerId: string, tileId?: string): boolean {
        const prohibitions = G.engine.attributes.prohibitions || {};

        // Global prohibition for this action
        if (prohibitions[actionType] === true) return true;

        // Player-specific prohibition
        if (prohibitions[playerId]?.[actionType] === true) return true;

        // Tile-specific prohibition (if applicable)
        if (tileId && prohibitions[tileId]?.[actionType] === true) return true;

        return false;
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
        const { playerId, slots, resourceIds, allowSubstitutions = false } = costSpec;
        if (slots.length === 0) {
            return { ok: true, resourceIds: [] };
        }

        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];
        const bank = G.zones['Bank'];
        if (!supply || !bank) {
            return { ok: false, error: 'missing supply or bank zone' };
        }

        if (resourceIds && resourceIds.length < slots.length) {
            return { ok: false, error: 'not enough resource ids provided' };
        }

        const usedSubstitution = { eco: false, sec: false };
        const selectedResourceIds: string[] = [];
        const usedResourceIds = new Set<string>();

        const canUseResource = (rid: string, slot: CostSlot): { ok: true; useEcoSubstitution: boolean; useSecSubstitution: boolean } | { ok: false } => {
            if (usedResourceIds.has(rid)) return { ok: false };
            if (!supply.items.includes(rid)) return { ok: false };

            const obj = G.objects[rid];
            if (!obj || obj.type !== 'Resource') return { ok: false };

            const normalizedSlot: CostSlot = slot === 'ANY' || slot.includes('ANY') ? 'ANY' : slot;
            if (normalizedSlot === 'ANY' || normalizedSlot.includes(obj.resort!)) {
                return { ok: true, useEcoSubstitution: false, useSecSubstitution: false };
            }

            if (!allowSubstitutions) {
                return { ok: false };
            }

            if (
                normalizedSlot.includes('ECO')
                && !usedSubstitution.eco
                && G.engine.attributes[`ecoSubstitute:${playerId}`]
            ) {
                return { ok: true, useEcoSubstitution: true, useSecSubstitution: false };
            }

            if (
                obj.resort === 'SEC'
                && !usedSubstitution.sec
                && G.engine.attributes[`secSubstitution:${playerId}`]
            ) {
                return { ok: true, useEcoSubstitution: false, useSecSubstitution: true };
            }

            return { ok: false };
        };

        for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
            const slot = slots[slotIdx];

            if (resourceIds) {
                const rid = resourceIds[slotIdx];
                if (!rid) {
                    return { ok: false, error: 'missing explicit resource id for cost slot' };
                }

                const check = canUseResource(rid, slot);
                if (!check.ok) {
                    return { ok: false, error: `invalid explicit payment resource "${rid}"` };
                }

                if (check.useEcoSubstitution) usedSubstitution.eco = true;
                if (check.useSecSubstitution) usedSubstitution.sec = true;
                usedResourceIds.add(rid);
                selectedResourceIds.push(rid);
                continue;
            }

            let selectedId: string | undefined;
            let selectedCheck: { ok: true; useEcoSubstitution: boolean; useSecSubstitution: boolean } | undefined;

            for (let i = supply.items.length - 1; i >= 0; i--) {
                const rid = supply.items[i];
                const check = canUseResource(rid, slot);
                if (check.ok) {
                    selectedId = rid;
                    selectedCheck = check;
                    break;
                }
            }

            if (!selectedId || !selectedCheck) {
                return { ok: false, error: 'insufficient resources for cost' };
            }

            if (selectedCheck.useEcoSubstitution) usedSubstitution.eco = true;
            if (selectedCheck.useSecSubstitution) usedSubstitution.sec = true;
            usedResourceIds.add(selectedId);
            selectedResourceIds.push(selectedId);
        }

        return { ok: true, resourceIds: selectedResourceIds };
    }

    public static commitCost(
        G: GameState & { engine: EngineState },
        _ctx: any,
        costSpec: CostSpec & { resourceIds: string[] }
    ): boolean {
        const { playerId, resourceIds } = costSpec;
        if (resourceIds.length === 0) return true;

        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];
        const bank = G.zones['Bank'];
        if (!supply || !bank) return false;

        for (const rid of resourceIds) {
            if (!supply.items.includes(rid)) return false;
            const obj = G.objects[rid];
            if (!obj || obj.type !== 'Resource') return false;
        }

        for (const rid of resourceIds) {
            const idx = supply.items.indexOf(rid);
            if (idx < 0) return false;
            supply.items.splice(idx, 1);
            bank.items.push(rid);
            G.objects[rid].owner = undefined;
        }

        return true;
    }

    public static checkAndPayCosts(G: GameState & { engine: EngineState }, pid: string, actionType: string, tileId?: string, extraResourceIds?: string[]): boolean {
        const attr = G.engine.attributes;
        const costSlots: CostSlot[] = [];

        // 1. Tile-based costs (Regulations, etc.)
        if (tileId && attr.tileExtraCosts?.[tileId]) {
            for (let i = 0; i < attr.tileExtraCosts[tileId]; i++) costSlots.push('ANY');
        }

        // 2. Player-based costs (Measures, etc.)
        if (attr.playerExtraCosts?.[pid]) {
            for (let i = 0; i < attr.playerExtraCosts[pid]; i++) costSlots.push('ANY');
        }

        // 3. Climate/Expansion rules
        if (attr.climateCostRules) {
            const isImmune = attr[`climateImmunity:${pid}`] || attr[`ignoreClimateCosts:${pid}`] || attr.ignoreClimateCostThisAction;
            if (!isImmune) {
                for (const rule of attr.climateCostRules) {
                    let apply = false;
                    if (rule.type === 'action' && rule.target === actionType) apply = true;
                    if (rule.type === 'tile' && rule.target === tileId) apply = true;
                    if (rule.type === 'resort' && tileId && G.tiles[tileId]?.resort === rule.target) apply = true;

                    if (apply) {
                        for (let i = 0; i < rule.amount; i++) costSlots.push(rule.resorts || 'ANY');
                    }
                }
            }
        }

        // Apply discount attribute
        if (attr[`ignoreCostIncrease:${pid}`] && costSlots.length > 0) {
            costSlots.shift();
        }

        if (costSlots.length === 0) return true;

        const validation = this.validateCost(G, null, {
            playerId: pid,
            slots: costSlots,
            resourceIds: extraResourceIds
        });
        if (!validation.ok) return false;

        const committed = this.commitCost(G, null, {
            playerId: pid,
            slots: costSlots,
            resourceIds: validation.resourceIds
        });
        if (!committed) return false;

        // Consume one-time costs if applicable
        if (attr.playerExtraCosts?.[pid] > 0) attr.playerExtraCosts[pid]--;

        return true;
    }

    public static resolve(G: GameState & { engine: EngineState }, ctx: any): boolean {
        const engine = G.engine;
        let ok = true;

        while (engine.effectQueue.length > 0 && !engine.pendingChoice) {
            const atom = engine.effectQueue.shift()!;
            ok = this.execute(G, ctx, atom);
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
    private static execute(G: GameState & { engine: EngineState }, ctx: any, atom: EffectAtom): boolean {
        const hook = this.getHookForAtom(atom);

        // 1. Apply "before" modifiers
        if (hook) {
            this.applyModifiers(G, ctx, `before${capitalize(hook)}` as HookPoint, atom);
        }

        // 2. Main Logic
        switch (atom.kind) {
            case 'resource.pay':
                if (!this.handleResourcePay(G, atom)) return false;
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
                this.handleInfluenceFormalize(G, ctx, atom);
                break;
            case 'influence.move':
                this.handleInfluenceMove(G, atom);
                break;
            case 'regulation.place':
                this.handleRegulationPlace(G, atom);
                break;
            case 'regulation.move':
                this.handleRegulationMove(G, atom);
                break;
            case 'regulation.remove':
                this.handleRegulationRemove(G, atom);
                break;
            case 'countdown.place':
                this.handleCountdownPlace(G, atom);
                break;
            case 'choice.request':
                // Deterministic pending choice token for network/replay stability.
                const choiceId = allocId(G, 'choice');
                G.engine.pendingChoice = {
                    ...atom.choice,
                    choiceId,
                    resumeToken: choiceId
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
            case 'measure.take':
                this.handleMeasureTake(G, ctx, atom);
                break;
            case 'measure.recycle':
                this.handleMeasureRecycle(G, ctx, atom);
                break;
            case 'rule.prohibit':
                this.handleRuleProhibit(G, atom);
                break;
            case 'rule.attribute':
                this.handleRuleAttribute(G, atom);
                break;
            case 'hook.trigger':
                this.triggerHook(G, ctx, atom.hook, atom.payload);
                break;
            case 'hotspot.resolve':
                this.handleHotspotResolve(G, ctx, atom);
                break;
        }

        // 3. Apply "after" modifiers
        if (hook) {
            this.applyModifiers(G, ctx, `after${capitalize(hook)}` as HookPoint, atom);
        }

        // Log to history
        G.engine.history.push({
            seq: G.engine.history.length,
            atom: atom.kind
        });

        return true;
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

    private static handleResourcePay(G: GameState & { engine: EngineState }, atom: any): boolean {
        const { playerId, amount, resorts } = atom;
        let resolvedPlayerId = playerId;

        if (resolvedPlayerId === 'CONTROLLER') {
            const contextTileId = atom.context?.tileId;
            if (!contextTileId) return false;
            const { controller } = computeMajority(contextTileId, G);
            if (!controller) return false;
            resolvedPlayerId = controller;
        }

        const slots: CostSlot[] = Array.from({ length: Math.max(0, amount) }, () => (
            resorts === 'ANY' ? 'ANY' : [...resorts]
        ));

        const validation = this.validateCost(G, null, {
            playerId: resolvedPlayerId,
            slots,
            resourceIds: atom.resourceIds,
            allowSubstitutions: !atom.resourceIds
        });

        if (!validation.ok) {
            console.error(`[resolver:resource.pay] ${validation.error}`);
            return false;
        }

        return this.commitCost(G, null, {
            playerId: resolvedPlayerId,
            slots,
            resourceIds: validation.resourceIds
        });
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
                playerId = 'NOISE';
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
                    const rid = allocId(G, `res_${resort}`);
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

    private static handleInfluenceFormalize(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
        this.applyModifiers(G, null, 'beforeAction', atom);
        const { playerId } = atom;
        if (countPlayerInfluence(G, playerId) >= getInfluenceCap(ctx)) {
            return;
        }

        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];

        // CORE-01-04-17: Create exactly one new Influence
        const infId = allocId(G, `inf_${playerId}_form`);
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

        // CORE-01-06-16: Tie split is even; remainder goes to Noise.
        const majority = computeMajority(tileId, G);
        const grants: Array<{ playerId: string; amount: number }> = [];

        if (majority.controller) {
            const cap = G.engine.attributes[`productionCap:${majority.controller}`];
            let finalAmount = baseAmount;
            if (cap !== undefined) {
                finalAmount = Math.min(baseAmount, cap);
            }
            if (finalAmount > 0) {
                grants.push({ playerId: majority.controller, amount: finalAmount });
            }
        } else if (majority.winners.length > 0 && baseAmount > 0) {
            const winners = [...majority.winners].sort();
            const splitAmount = Math.floor(baseAmount / winners.length);
            const remainder = baseAmount % winners.length;

            if (splitAmount > 0) {
                for (const winner of winners) {
                    grants.push({ playerId: winner, amount: splitAmount });
                }
            }

            if (remainder > 0) {
                grants.push({ playerId: 'NOISE', amount: remainder });
            }
        }

        for (let i = grants.length - 1; i >= 0; i--) {
            const grant = grants[i];
            G.engine.effectQueue.unshift({
                kind: 'resource.grant',
                playerId: grant.playerId as any,
                amount: grant.amount,
                resort: tile.resort,
                context: { tileId, source: 'production', baseAmount }
            });
        }
    }

    private static handleCountdownPlace(G: GameState & { engine: EngineState }, atom: any): void {
        const { targetTileId, amount = 3 } = atom;
        const supply = G.zones.CountdownSupply;
        if (!supply || supply.items.length === 0) return;

        const cid = supply.items.pop()!;
        const obj = G.objects[cid];
        if (obj) {
            obj.targetTileId = targetTileId;
            (obj as any).amount = amount;
        }

        const targetZone = G.zones[targetTileId];
        if (targetZone) {
            targetZone.items.push(cid);
        }
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

        // Standard Recycle and Hand Removal
        const handId = `PlayerHand:${playerId}`;
        const hand = G.zones[handId];
        if (hand) {
            const idx = hand.items.indexOf(measureObjectId);
            if (idx >= 0) hand.items.splice(idx, 1);
        }

        obj.playCount = (obj.playCount || 0) + 1;
        obj.owner = undefined;

        // Determine Zones based on prefix
        let recycleZone = 'MeasureRecyclePile';
        let discardZone = 'MeasureFinalDiscard';

        if (measureObjectId.startsWith('exp02_')) {
            recycleZone = 'EXP02_MeasureRecyclePile';
            discardZone = 'EXP02_MeasureFinalDiscard';
        } else if (measureObjectId.startsWith('exp03_')) {
            recycleZone = 'EXP03_MeasureRecyclePile';
            discardZone = 'EXP03_MeasureFinalDiscard';
        }

        const targetZone = obj.playCount === 1 ? recycleZone : discardZone;
        if (G.zones[targetZone]) {
            G.zones[targetZone].items.push(measureObjectId);
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

    private static handleMeasureTake(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
        const { playerId, measureObjectId } = atom;
        const obj = G.objects[measureObjectId];
        if (!obj || obj.type !== 'Measure') return;

        // Determine correct zones based on prefix
        let openZoneId = 'OpenMeasures';
        let drawPileId = 'MeasureDrawPile';
        let recyclePileId = 'MeasureRecyclePile';

        if (measureObjectId.startsWith('exp02_')) {
            openZoneId = 'EXP02_OpenMeasures';
            drawPileId = 'EXP02_MeasureDrawPile';
            recyclePileId = 'EXP02_MeasureRecyclePile';
        } else if (measureObjectId.startsWith('exp03_')) {
            openZoneId = 'EXP03_OpenMeasures';
            drawPileId = 'EXP03_MeasureDrawPile';
            recyclePileId = 'EXP03_MeasureRecyclePile';
        }

        const openZone = G.zones[openZoneId];
        const hand = G.zones[`PlayerHand:${playerId}`];
        if (!openZone || !hand) return;

        const idx = openZone.items.indexOf(measureObjectId);
        if (idx >= 0) {
            openZone.items.splice(idx, 1);
            hand.items.push(measureObjectId);
            obj.owner = playerId;

            // Refill logic
            const drawPile = G.zones[drawPileId];
            if (drawPile && drawPile.items.length > 0) {
                openZone.items.push(drawPile.items.pop()!);
            } else {
                // Trigger recycle
                this.handleMeasureRecycle(G, ctx, { kind: 'measure.recycle', drawPileId, recyclePileId });
                if (drawPile && drawPile.items.length > 0) {
                    openZone.items.push(drawPile.items.pop()!);
                }
            }
        }
    }

    private static handleMeasureRecycle(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
        const { drawPileId, recyclePileId } = atom;
        const drawPile = G.zones[drawPileId];
        const recyclePile = G.zones[recyclePileId];

        if (drawPile && recyclePile && recyclePile.items.length > 0) {
            drawPile.items = ctx.random.Shuffle([...recyclePile.items]);
            recyclePile.items = [];
        }
    }

    private static handleRuleAttribute(G: GameState & { engine: EngineState }, atom: any): void {
        const { attribute, value, playerId, targetTileId, context } = atom;
        const key = playerId ? `${attribute}:${playerId}` : (targetTileId ? `${attribute}:${targetTileId}` : attribute);

        if (context?.append) {
            if (!G.engine.attributes[key]) G.engine.attributes[key] = [];
            if (Array.isArray(G.engine.attributes[key])) {
                G.engine.attributes[key].push(value);
            }
        } else {
            G.engine.attributes[key] = value;
        }
    }

    private static handleRuleProhibit(G: GameState & { engine: EngineState }, atom: any): void {
        G.engine.effectQueue = []; // Full stop
    }

    private static handleRegulationPlace(G: GameState & { engine: EngineState }, atom: any): void {
        const { regType, targetTileId } = atom;
        const supply = G.zones.RegulationSupply;
        const attached = G.zones.BoardAttached;
        if (!supply || !attached) return;

        let regId = supply.items.find(id => G.objects[id].regType === regType);
        if (!regId) {
            regId = allocId(G, `reg_${regType}_gen`);
            G.objects[regId] = { id: regId, type: 'Regulation', regType };
        } else {
            supply.items.splice(supply.items.indexOf(regId), 1);
        }
        attached.items.push(regId);
        G.objects[regId].targetTileId = targetTileId;
    }

    private static handleRegulationMove(G: GameState & { engine: EngineState }, atom: any): void {
        const { regulationId, targetTileId } = atom;
        const obj = G.objects[regulationId];
        if (!obj || obj.type !== 'Regulation') return;

        // Check M13 protection
        const protectedTiles = G.engine.attributes.protectedTiles || [];
        if (protectedTiles.includes(obj.targetTileId)) return;

        obj.targetTileId = targetTileId;
    }

    private static handleRegulationRemove(G: GameState & { engine: EngineState }, atom: any): void {
        const { regulationId } = atom;
        const obj = G.objects[regulationId];
        if (!obj || obj.type !== 'Regulation') return;

        // Check M13 protection
        const protectedTiles = G.engine.attributes.protectedTiles || [];
        if (protectedTiles.includes(obj.targetTileId)) return;

        const attached = G.zones.BoardAttached;
        const supply = G.zones.RegulationSupply;
        if (!attached || !supply) return;

        const idx = attached.items.indexOf(regulationId);
        if (idx >= 0) {
            attached.items.splice(idx, 1);
        }
    }

    private static handleHotspotResolve(G: GameState & { engine: EngineState }, ctx: any, atom: any): void {
        const { tileId } = atom;
        const tile = G.tiles[tileId];
        if (!tile) return;

        // 1. Prohibitions & Modifiers
        if (this.isProhibited(G, 'hotspot.resolve', 'NONE', tileId)) return;
        this.applyModifiers(G, ctx, 'beforeAction', atom);

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

        this.applyModifiers(G, ctx, 'afterAction', atom);
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function allocId(G: GameState & { engine: EngineState }, prefix: string): string {
    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}
