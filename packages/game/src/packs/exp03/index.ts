import { Expansion03 } from '@balance-control/expansion-03';
import type { EnginePackDefinition } from '../types';
import { placeCountdownMarker, playMeasure, takeMeasure } from '../../expansion-moves';
import { exp03CountdownAtoms } from '../../engine/atoms/countdown';

export const Exp03Pack: EnginePackDefinition = {
    id: 'exp03',
    name: Expansion03.name,
    moves: {
        'exp03.takeMeasure': takeMeasure,
        'exp03.playMeasure': playMeasure,
        'exp03.placeCountdown': placeCountdownMarker,
    },
    resources: Expansion03.resources,
    zones: Expansion03.zones,
    measureDecks: Expansion03.measureDecks,
    modifiers: Expansion03.modifiers,
    effectHandlers: Expansion03.effectHandlers,
    getMeasureAtoms: Expansion03.getMeasureAtoms,
    setup: Expansion03.onSetup
        ? {
              preShuffle: (G, ctx) => Expansion03.onSetup?.(G, ctx),
          }
        : undefined,
    engine: {
        atoms: () => [...exp03CountdownAtoms],
    },
};
