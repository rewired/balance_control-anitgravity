import type { GameConfig, GameState } from '@balance-control/rules';
import type { AtomRegistration } from '../engine/engine-module-registry';

export type EnginePackId = 'core' | 'exp01' | 'exp02' | 'exp03';

export type EnginePackDefinition = Readonly<{
    id: EnginePackId;
    name: string;
    moves?: Record<string, (...args: any[]) => any>;
    setup?: {
        preShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
        postShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
    };
    engine?: {
        atoms?: (args: { triggerHook: (...args: any[]) => unknown }) => AtomRegistration[];
    };
}>;

