import type { ExpansionFlags, GameConfig } from '@balance-control/rules';
export type { ExpansionFlags, GameConfig } from '@balance-control/rules';

export const DEFAULT_EXPANSION_FLAGS: ExpansionFlags = {
    ex01: false,
    ex02: false,
    ex03: false,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
    expansions: { ...DEFAULT_EXPANSION_FLAGS }
};

function readExpansionConfigCandidate(setupData: unknown): unknown {
    if (!setupData || typeof setupData !== 'object') return undefined;
    const source = setupData as Record<string, unknown>;

    if (source.expansions && typeof source.expansions === 'object') {
        return source.expansions;
    }

    if (source.config && typeof source.config === 'object') {
        const nested = source.config as Record<string, unknown>;
        if (nested.expansions && typeof nested.expansions === 'object') {
            return nested.expansions;
        }
    }

    return undefined;
}

export function normalizeGameConfig(setupData: unknown): GameConfig {
    const expansionsCandidate = readExpansionConfigCandidate(setupData);
    const candidate = (expansionsCandidate ?? {}) as Record<string, unknown>;

    return {
        expansions: {
            ex01: candidate.ex01 === true,
            ex02: candidate.ex02 === true,
            ex03: candidate.ex03 === true,
        }
    };
}
