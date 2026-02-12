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
            // CONTROLLER grants must always declare missingController explicitly.
            {
                kind: 'resource.grant',
                playerId: 'CONTROLLER',
                missingController: 'SKIP',
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
