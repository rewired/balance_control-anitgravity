import type { GameConfig, GameState, MeasureDeckDescriptor, ResourceType } from '@balance-control/rules';
import type { AtomRegistration } from '../engine/engine-module-registry';

export type EnginePackId = 'core' | 'exp01' | 'exp02' | 'exp03';

export type EnginePackDefinition = Readonly<{
    id: EnginePackId;
    name: string;
    moves?: Record<string, (...args: any[]) => any>;
    resources?: ResourceType[];
    zones?: string[];
    measureDecks?: MeasureDeckDescriptor[];
    modifiers?: {
        production?: (tileId: string, G: GameState, baseAmount: number) => number;
        cost?: (effect: any, G: GameState, baseCost: any) => any;
    };
    effectHandlers?: Record<string, (G: GameState, ctx: any, effect: any, utils: any) => void>;
    getMeasureAtoms?: (G: GameState, measureId: string, payload: any) => any[] | null;
    setup?: {
        preShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
        postShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
    };
    engine?: {
        atoms?: (args: { triggerHook: (...args: any[]) => unknown }) => AtomRegistration[];
    };
}>;
