import { Tile, TileType } from '@balance-control/rules';
import coreTilesData from './resources/core-tiles.json';

// Type definition for the JSON structure to ensure type safety
interface TileGroup {
    type: string;
    count: number;
    resort?: string;
    weight?: number;
    conversion?: {
        inputSlots: number;
        outputSlots: number;
        typedResort?: string;
    };
}

interface CoreTilesData {
    base: TileGroup[];
    add56: TileGroup[];
}

const data = coreTilesData as CoreTilesData;

/**
 * Generates the CORE tile set from JSON definition.
 * Replaces the hardcoded logic in previous versions.
 * @param numPlayers Number of players in the match
 */
export function generateCoreTiles(numPlayers: number): Tile[] {
    const tiles: Tile[] = [];
    let idCounter = 1;

    const processGroup = (group: TileGroup) => {
        for (let i = 0; i < group.count; i++) {
            // Replicate the exact ID and Name generation from the original code
            const id = `tile_core_${idCounter++}`;
            const name = `${group.type} ${i + 1}`;

            // Construct the tile object
            const tile: Tile = {
                id,
                type: group.type as TileType,
                name,
            };

            // Add optional properties if they exist
            if (group.resort) tile.resort = group.resort;
            if (group.weight) tile.weight = group.weight;
            if (group.conversion) tile.conversion = group.conversion;

            tiles.push(tile);
        }
    };

    // 1. Process Base Tiles
    data.base.forEach(processGroup);

    // 2. Process ADD56 Tiles if applicable
    if (numPlayers >= 5) {
        data.add56.forEach(processGroup);
    }

    return tiles;
}
