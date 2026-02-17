import { Expansion01 } from '@balance-control/expansion-01';
import type { EnginePackDefinition } from '../types';
import { playMeasure, takeMeasure } from '../../expansion-moves';

export const Exp01Pack: EnginePackDefinition = {
    id: 'exp01',
    name: Expansion01.name,
    moves: {
        'exp01.takeMeasure': takeMeasure,
        'exp01.playMeasure': playMeasure,
    },
    resources: Expansion01.resources,
    zones: Expansion01.zones,
    measureDecks: Expansion01.measureDecks,
    modifiers: Expansion01.modifiers,
    effectHandlers: Expansion01.effectHandlers,
    getMeasureAtoms: Expansion01.getMeasureAtoms,
    setup: Expansion01.onSetup
        ? {
              preShuffle: (G, ctx) => Expansion01.onSetup?.(G, ctx),
          }
        : undefined,
};
