import type { EnginePackDefinition, PackManifest } from '@balance-control/game';

export interface DummyPackOptions {
    id: string;
    name?: string;
    moves?: Record<string, any>;
    resources?: string[];
    zones?: string[];
    measureDecks?: any[];
    modifiers?: any;
    effectHandlers?: any;
    getMeasureAtoms?: any;
    setup?: any;
    engine?: any;
}

export function makeDummyExpansionPack(options: DummyPackOptions): EnginePackDefinition {
    const {
        id,
        name = `DummyPack-${id}`,
        moves = {},
        resources = [],
        zones = [],
        measureDecks = [],
        modifiers,
        effectHandlers,
        getMeasureAtoms,
        setup,
        engine,
    } = options;

    const manifest: PackManifest = {
        id,
        packVersion: '0.0.0',
        rulesetAnchor: `${id}-anchor`,
        required: false,
    };

    return {
        id,
        name,
        manifest,
        moves,
        resources,
        zones,
        measureDecks,
        modifiers,
        effectHandlers,
        getMeasureAtoms,
        setup,
        engine,
    } as any;
}
