import type { ResourceType } from './resources';

export type RegulationType = 'SecurityLevel' | 'Control' | 'Administration' | 'Blockade';

/**
 * Common properties for all game objects.
 * @rule CORE-01-02-03A
 * @rule CORE-01-02-17B
 */
export interface GameObject {
    id: string;
    type: 'Influence' | 'Resource' | 'Measure' | 'Regulation' | 'CountdownMarker' | 'MetaMarker';
    owner?: string;
    resort?: ResourceType;
    isStarting?: boolean;
    // Expansion attributes
    measureId?: string;
    playCount?: number;
    // EXP-02-00 attributes
    regType?: RegulationType;
    targetTileId?: string;
    mode?: 'ReturnPenalty' | 'Convert';
}
