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

    public static checkAndPayCosts(G: GameState & { engine: EngineState }, pid: string, actionType: string, tileId?: string, extraResourceIds?: string[]): boolean {
        const attr = G.engine.attributes;
        let totalCost = 0;
        const allowedResorts: string[][] = [];

        // 1. Tile-based costs (Regulations, etc.)
        if (tileId && attr.tileExtraCosts?.[tileId]) {
            totalCost += attr.tileExtraCosts[tileId];
            for (let i = 0; i < attr.tileExtraCosts[tileId]; i++) allowedResorts.push(['ANY']);
        }

        // 2. Player-based costs (Measures, etc.)
        if (attr.playerExtraCosts?.[pid]) {
            totalCost += attr.playerExtraCosts[pid];
            for (let i = 0; i < attr.playerExtraCosts[pid]; i++) allowedResorts.push(['ANY']);
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
                        totalCost += rule.amount;
                        for (let i = 0; i < rule.amount; i++) allowedResorts.push(rule.resorts || ['ANY']);
                    }
                }
            }
        }

        // Apply discount attribute
        if (attr[`ignoreCostIncrease:${pid}`] && totalCost > 0) {
            totalCost = Math.max(0, totalCost - 1);
            allowedResorts.shift();
        }

        if (totalCost === 0) return true;
        if (!extraResourceIds || extraResourceIds.length < totalCost) return false;

        const supplyId = `PersonalSupply:${pid}`;
        const supply = G.zones[supplyId];
        const bank = G.zones['Bank'];
        if (!supply || !bank) return false;

        // Verify and Deduct
        const toDeduct: string[] = [];
        for (let i = 0; i < totalCost; i++) {
            const rid = extraResourceIds[i];
            const obj = G.objects[rid];
            const allowed = allowedResorts[i] || ['ANY'];

            if (!supply.items.includes(rid)) return false;
            if (!obj || obj.type !== 'Resource') return false;
            if (allowed[0] !== 'ANY' && !allowed.includes(obj.resort!)) return false;

            toDeduct.push(rid);
        }

        // Deduct
        toDeduct.forEach(rid => {
            const idx = supply.items.indexOf(rid);
            supply.items.splice(idx, 1);
            bank.items.push(rid);
            G.objects[rid].owner = undefined;
        });

        // Consume one-time costs if applicable
        if (attr.playerExtraCosts?.[pid] > 0) attr.playerExtraCosts[pid]--;

        return true;
    }

    public static resolve(G: GameState & { engine: EngineState }, ctx: any): void {
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
                G.engine.pendingChoice = {
                    ...atom.choice,
                    resumeToken: allocId(G, 'resume')
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
            tick: G.engine.history.length,
            atom: atom.kind,
            ts: G.engine.history.length
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

    private static handleResourcePay(G: GameState & { engine: EngineState }, atom: any): void {
        const { playerId, amount, resorts } = atom;
        const supplyId = `PersonalSupply:${playerId}`;
        const supply = G.zones[supplyId];
        const bank = G.zones['Bank'];

        if (!supply || !bank) return;

        let count = 0;
        const usedSubstitution = { eco: false, sec: false };

        // 1. Try to pay normally
        for (let i = supply.items.length - 1; i >= 0 && count < amount; i--) {
            const rid = supply.items[i];
            const obj = G.objects[rid];
            if (!obj || obj.type !== 'Resource') continue;

            let canUse = resorts === 'ANY' || resorts.includes(obj.resort!);

            // M08: Eco Substitute (1 non-ECO as ECO)
            if (!canUse && resorts.includes('ECO') && !usedSubstitution.eco && G.engine.attributes[`ecoSubstitute:${playerId}`]) {
                canUse = true;
                usedSubstitution.eco = true;
            }

            // M06: SEC Substitution (1 SEC as Any)
            if (!canUse && obj.resort === 'SEC' && !usedSubstitution.sec && G.engine.attributes[`secSubstitution:${playerId}`]) {
                canUse = true;
                usedSubstitution.sec = true;
            }

            if (canUse) {
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

    private static handleInfluenceFormalize(G: GameState & { engine: EngineState }, atom: any): void {
        this.applyModifiers(G, null, 'beforeAction', atom);
        const { playerId } = atom;
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

        // 2. Grant the base printed amount - unshift LAST so it is at the FRONT
        const { controller } = computeMajority(tileId, G);
        const cap = controller ? G.engine.attributes[`productionCap:${controller}`] : undefined;
        let finalAmount = baseAmount;
        if (cap !== undefined) {
            finalAmount = Math.min(baseAmount, cap);
        }

        G.engine.effectQueue.unshift({
            kind: 'resource.grant',
            playerId: 'CONTROLLER',
            amount: finalAmount,
            resort: tile.resort,
            context: { tileId, source: 'production', baseAmount: finalAmount }
        });
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
