/**
 * Expansion Pack: Security & Order (EXP-02-00).
 * @expansion EXP-02-00
 * @requires CORE-01-00
 * @deterministic
 * @rule EXP-02-04-B
 */

import { Expansion02 } from '@balance-control/expansion-02/engine';
import { RULESET_MANIFEST } from '@balance-control/rules';
import { exp02RegulationAtoms, type EnginePackDefinition, type PackManifest } from '@balance-control/game';
import { takeMeasure, playMeasure } from './measure-moves';

const EXP02_PACK_VERSION = (RULESET_MANIFEST.expansions.exp02Version ?? '0.0.0').replace(/^v/i, '');
const EXP02_PACK_MANIFEST: PackManifest = {
    id: 'exp02',
    packVersion: EXP02_PACK_VERSION,
    rulesetAnchor: `EXP-02 ${RULESET_MANIFEST.expansions.exp02Version ?? 'v0.0.0'}`,
    required: false,
};

/**
 * Engine Pack Definition for EXP-02-00.
 */
export const Exp02Pack: EnginePackDefinition = {
    id: 'exp02',
    name: Expansion02.name,
    manifest: EXP02_PACK_MANIFEST,
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
              preShuffle: (G: any, ctx: any) => Expansion02.onSetup?.(G, ctx),
          }
        : undefined,
    engine: {
        atoms: () => [...exp02RegulationAtoms],
    },
};
