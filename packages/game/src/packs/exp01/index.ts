import { Expansion01 } from '@balance-control/expansion-01';
import { RULESET_MANIFEST } from '@balance-control/rules';
import type { EnginePackDefinition, PackManifest } from '../types';
import { playMeasure, takeMeasure } from '../../expansion-moves';

const EXP01_PACK_VERSION = (RULESET_MANIFEST.expansions.exp01Version ?? '0.0.0').replace(/^v/i, '');
const EXP01_PACK_MANIFEST: PackManifest = {
    id: 'exp01',
    packVersion: EXP01_PACK_VERSION,
    rulesetAnchor: `EXP-01 ${RULESET_MANIFEST.expansions.exp01Version ?? 'v0.0.0'}`,
    required: false,
};

export const Exp01Pack: EnginePackDefinition = {
    id: 'exp01',
    name: Expansion01.name,
    manifest: EXP01_PACK_MANIFEST,
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
