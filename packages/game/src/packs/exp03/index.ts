import { Expansion03 } from '@balance-control/expansion-03';
import { RULESET_MANIFEST } from '@balance-control/rules';
import type { EnginePackDefinition, PackManifest } from '../types';
import { placeCountdownMarker, playMeasure, takeMeasure } from '../../expansion-moves';
import { exp03CountdownAtoms } from '../../engine/atoms/countdown';

const EXP03_PACK_VERSION = (RULESET_MANIFEST.expansions.exp03Version ?? '0.0.0').replace(/^v/i, '');
const EXP03_PACK_MANIFEST: PackManifest = {
    id: 'exp03',
    packVersion: EXP03_PACK_VERSION,
    rulesetAnchor: `EXP-03 ${RULESET_MANIFEST.expansions.exp03Version ?? 'v0.0.0'}`,
    required: false,
};

export const Exp03Pack: EnginePackDefinition = {
    id: 'exp03',
    name: Expansion03.name,
    manifest: EXP03_PACK_MANIFEST,
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
