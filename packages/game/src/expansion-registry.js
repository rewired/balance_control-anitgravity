"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpansionRegistry = void 0;
class Registry {
    constructor() {
        this.expansions = new Map();
        // ... other hooks
    }
    register(def) {
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
    applySetup(G, ctx) {
        this.expansions.forEach(exp => {
            if (exp.onSetup)
                exp.onSetup(G, ctx);
        });
    }
    applyEffect(G, ctx, effect, contextTileId, utils) {
        this.expansions.forEach(exp => {
            if (exp.effectHandlers && exp.effectHandlers[effect.type]) {
                exp.effectHandlers[effect.type](G, ctx, effect, utils);
            }
        });
    }
}
exports.ExpansionRegistry = new Registry();
//# sourceMappingURL=expansion-registry.js.map