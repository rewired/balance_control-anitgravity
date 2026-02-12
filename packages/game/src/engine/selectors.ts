import { TileSelector, PlayerSelector } from './types';
import { GameState, TileType, PlayerID } from '@balance-control/rules';

export function evaluateTileSelector(selector: TileSelector, tileId: string, G: GameState): boolean {
    const tile = G.tiles[tileId];
    if (!tile) return false;

    switch (selector.op) {
        case 'and':
            return selector.args.every(arg => evaluateTileSelector(arg, tileId, G));
        case 'or':
            return selector.args.some(arg => evaluateTileSelector(arg, tileId, G));
        case 'not':
            return !evaluateTileSelector(selector.arg, tileId, G);
        case 'eq':
            const val = getTileValue(tile, selector.key, G);
            return val === selector.value;
        case 'in':
            const inVal = getTileValue(tile, selector.key, G);
            return selector.values.includes(inVal);
        default:
            return false;
    }
}

function getTileValue(tile: any, key: string, G: any): any {
    switch (key) {
        case 'tileType': return tile.type;
        case 'id': return tile.id;
        case 'resort': return tile.resort;
        case 'isHotspot': return tile.type === TileType.Hotspot;
        // Tags or other dynamic props can be added here
        default: return undefined;
    }
}

export function evaluatePlayerSelector(selector: PlayerSelector, playerId: PlayerID, ctx: any): boolean {
    if (selector.op === 'all') return true;

    if (selector.op === 'eq') {
        const target = selector.value;
        if (target === 'currentPlayer') return playerId === ctx.currentPlayer;
        if (target === 'opponent') return playerId !== ctx.currentPlayer;
        return playerId === target;
    }

    return false;
}
