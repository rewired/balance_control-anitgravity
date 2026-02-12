import { ExpansionDefinition, GameState } from '@balance-control/rules';
import { ExpansionFlags, DEFAULT_EXPANSION_FLAGS, GameConfig } from './config';

const EXPANSION_NAME_TO_FLAG: Record<string, keyof ExpansionFlags> = {
    'EXP-01 Economy & Labor': 'ex01',
    'EXP-02 Security & Order': 'ex02',
    'EXP-03 Climate & Future': 'ex03',
};

class Registry {
    private expansions: Map<string, ExpansionDefinition> = new Map();

    private resolveFlags(G?: GameState, config?: GameConfig): ExpansionFlags {
        if (config?.expansions) {
            return {
                ex01: config.expansions.ex01 === true,
                ex02: config.expansions.ex02 === true,
                ex03: config.expansions.ex03 === true,
            };
        }

        const stored = (G as any)?.engine?.attributes?.enabledExpansions;
        if (stored && typeof stored === 'object') {
            const candidate = stored as Record<string, unknown>;
            return {
                ex01: candidate.ex01 === true,
                ex02: candidate.ex02 === true,
                ex03: candidate.ex03 === true,
            };
        }

        return { ...DEFAULT_EXPANSION_FLAGS };
    }

    private isEnabled(exp: ExpansionDefinition, flags: ExpansionFlags): boolean {
        const mappedFlag = EXPANSION_NAME_TO_FLAG[exp.name];
        if (!mappedFlag) return true;
        return flags[mappedFlag] === true;
    }

    register(def: ExpansionDefinition) {
        if (this.expansions.has(def.name)) {
            console.warn(`Expansion ${def.name} already registered.`);
            return;
        }
        this.expansions.set(def.name, def);
        console.log(`Expansion registered: ${def.name}`);
    }

    getAll() {
        return Array.from(this.expansions.values());
    }

    clear() {
        this.expansions.clear();
    }

    getMergedMoves(config?: GameConfig) {
        const flags = config ? this.resolveFlags(undefined, config) : undefined;
        let allMoves: Record<string, (arg0: any, arg1: any) => any> = {};
        this.expansions.forEach(exp => {
            if (flags && !this.isEnabled(exp, flags)) return;
            if (exp.moves) {
                allMoves = { ...allMoves, ...exp.moves };
            }
        });
        return allMoves;
    }

    // Hook Executors
    applySetup(G: GameState, ctx: any, config?: GameConfig) {
        const flags = this.resolveFlags(G, config);
        this.expansions.forEach(exp => {
            if (!this.isEnabled(exp, flags)) return;
            if (exp.onSetup) exp.onSetup(G, ctx);
        });
    }

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        const flags = this.resolveFlags(G);
        for (const exp of this.expansions.values()) {
            if (!this.isEnabled(exp, flags)) continue;
            if (exp.getMeasureAtoms) {
                const atoms = exp.getMeasureAtoms(G, measureId, payload);
                if (atoms) return atoms;
            }
        }
        return null;
    }

    applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any, config?: GameConfig) {
        const flags = this.resolveFlags(G, config);
        this.expansions.forEach(exp => {
            if (!this.isEnabled(exp, flags)) return;
            if (exp.effectHandlers && exp.effectHandlers[effect.type]) {
                exp.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        });
    }

    applyProductionModifiers(G: GameState, tileId: string, baseAmount: number, config?: GameConfig): number {
        const flags = this.resolveFlags(G, config);
        let amount = baseAmount;

        this.expansions.forEach(exp => {
            if (!this.isEnabled(exp, flags)) return;
            const productionModifier = exp.modifiers?.production;
            if (!productionModifier) return;

            const nextAmount = productionModifier(tileId, G, amount);
            if (typeof nextAmount === 'number' && Number.isFinite(nextAmount)) {
                amount = nextAmount;
            }
        });

        return amount;
    }
    // ... other hooks
}

export const ExpansionRegistry = new Registry();
