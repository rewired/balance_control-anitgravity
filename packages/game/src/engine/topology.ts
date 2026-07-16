import { GameState } from '@balance-control/rules';

/**
 * Generic board-adjacency contract (AGENTS.md §1.4): true if `targetId` is a
 * direct neighbor of `sourceId` per the current topology's precomputed
 * adjacency map. Ruleset-agnostic — carries no rule-specific exceptions.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function isAdjacent(G: GameState, sourceId: string, targetId: string): boolean {
    const neighbors = G.adjacency[sourceId] || [];
    return neighbors.includes(targetId);
}
