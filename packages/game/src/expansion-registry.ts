import { ExpansionDefinition, GameState } from '@balance-control/rules';

class Registry {
    private expansions: Map<string, ExpansionDefinition> = new Map();

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

    // Hook Executors
    applySetup(G: GameState, ctx: any) {
        this.expansions.forEach(exp => {
            if (exp.onSetup) exp.onSetup(G, ctx);
        });
    }

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        for (const exp of this.expansions.values()) {
            if (exp.getMeasureAtoms) {
                const atoms = exp.getMeasureAtoms(G, measureId, payload);
                if (atoms) return atoms;
            }
        }
        return null;
    }

    applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any) {
        this.expansions.forEach(exp => {
            if (exp.effectHandlers && exp.effectHandlers[effect.type]) {
                exp.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        });
    }
    // ... other hooks
}

export const ExpansionRegistry = new Registry();
