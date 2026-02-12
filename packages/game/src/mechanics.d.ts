import { GameState, ResourceType } from '@balance-control/rules';
export interface MajorityResult {
    controller: string | null;
    winners: string[];
}
export declare function computeMajority(tileId: string, G: GameState, visited?: Set<string>): MajorityResult;
/**
 * EXP-02 Regulation Evaluation
 * Order: 1. Blockade, 2. Cost (Control/Admin), 3. Output (SecurityLevel)
 */
export declare function getRegulationModifiers(tileId: string, G: GameState): {
    isBlockaded: boolean;
    extraCost: number;
    outputReduction: number;
};
export declare function resolveEffect(G: GameState, ctx: any, effect: any, contextTileId?: string): void;
export declare function resolveProduction(tileId: string, G: GameState): void;
export declare function grantResources(G: GameState, owner: string, resort: ResourceType, amount: number): void;
//# sourceMappingURL=mechanics.d.ts.map