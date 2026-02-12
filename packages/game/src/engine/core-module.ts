import { EffectAtom, HookPoint, ExpiryTrigger } from './types';
import { PlayerID, ResourceType, TileType, GameState } from '@balance-control/rules';

/**
 * The "Core" module, implemented using the engine's DSL.
 */
export const CoreModule = {
    name: 'Core Base',

    /** 
     * Hooks that implement the core production loop 
     */
    productionAtoms: (tileId: string, G: GameState): EffectAtom[] => {
        const tile = G.tiles[tileId];
        if (!tile || tile.type !== TileType.Resort || !tile.resort || !tile.weight) return [];

        return [
            // 1. Calculate base amount (as an atom that sets a context value or just uses the weight)
            {
                kind: 'resource.grant',
                playerId: 'CONTROLLER', // Special keyword for the distribution atom 
                amount: tile.weight,
                resort: tile.resort,
                context: { tileId }
            }
        ];
    },

    /**
     * Standard definitions for core measures/actions
     */
    actionHandlers: {
        'FORMALIZE': (playerId: PlayerID, resourceIds: string[], resorts: ResourceType[]): EffectAtom[] => {
            return [
                { kind: 'resource.pay', playerId, amount: resorts.length, resorts: resorts },
                { kind: 'influence.formalize', playerId, resourceIds }
            ];
        }
    }
};
