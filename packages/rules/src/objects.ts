import type { ResourceType } from './resources';

export type RegulationType = 'SecurityLevel' | 'Control' | 'Administration' | 'Blockade';

export interface GameObject {
    id: string;
    type: 'Influence' | 'Resource' | 'Measure' | 'Regulation' | 'CountdownMarker' | 'MetaMarker';
    owner?: string;
    resort?: ResourceType;
    isStarting?: boolean;
    // Expansion attributes
    measureId?: string;
    playCount?: number;
    // EXP-02 attributes
    regType?: RegulationType;
    targetTileId?: string;
    mode?: 'PingPong' | 'Convert';
}
