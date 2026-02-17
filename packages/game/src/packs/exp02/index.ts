import { Expansion02 } from '@balance-control/expansion-02';
import type { EnginePackDefinition } from '../types';
import { playMeasure, takeMeasure } from '../../expansion-moves';
import { exp02RegulationAtoms } from '../../engine/atoms/regulation';

export const Exp02Pack: EnginePackDefinition = {
    id: 'exp02',
    name: Expansion02.name,
    moves: {
        'exp02.takeMeasure': takeMeasure,
        'exp02.playMeasure': playMeasure,
    },
    resources: Expansion02.resources,
    zones: Expansion02.zones,
    measureDecks: Expansion02.measureDecks,
    modifiers: Expansion02.modifiers,
    effectHandlers: Expansion02.effectHandlers,
    getMeasureAtoms: Expansion02.getMeasureAtoms,
    setup: Expansion02.onSetup
        ? {
              preShuffle: (G, ctx) => Expansion02.onSetup?.(G, ctx),
          }
        : undefined,
    engine: {
        atoms: () => [...exp02RegulationAtoms],
    },
};
