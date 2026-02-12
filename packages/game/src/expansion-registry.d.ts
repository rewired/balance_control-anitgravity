import { ExpansionDefinition, GameState } from '@balance-control/rules';
declare class Registry {
    private expansions;
    register(def: ExpansionDefinition): void;
    getAll(): ExpansionDefinition[];
    clear(): void;
    applySetup(G: GameState, ctx: any): void;
    applyEffect(G: GameState, ctx: any, effect: any, contextTileId?: string, utils?: any): void;
}
export declare const ExpansionRegistry: Registry;
export {};
//# sourceMappingURL=expansion-registry.d.ts.map