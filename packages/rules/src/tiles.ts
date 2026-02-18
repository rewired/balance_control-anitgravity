import type { ResourceType } from './resources';

export enum TileType {
    Resort = 'Resort',
    Committee = 'Committee',
    Grassroots = 'Grassroots',
    Lobbyist = 'Lobbyist',
    Hotspot = 'Hotspot',
    StartCommittee = 'StartCommittee',
    SystemTile = 'SystemTile',
}

export interface GrassrootsConversionMetadata {
    inputSlots: number;
    outputSlots: number;
    /** CORE-01-04-22L: Typed Grassroots have resort T; Variant B allows 3:1 with output ≠ T */
    typedResort?: ResourceType;
}

export interface Tile {
    id: string;
    type: TileType;
    resort?: ResourceType;
    weight?: number;
    name?: string;
    conversion?: GrassrootsConversionMetadata;
    // EXP-01 attributes
    isHotspot?: boolean;
}
