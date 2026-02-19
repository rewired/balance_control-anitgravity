/**
 * Expansion Pack: Economy & Labor (EXP-01).
 * @expansion EXP-01
 * @requires SPEC-CORE-01
 * @deterministic
 * @rule EXP-01-07
 */

import { Expansion01 } from '@balance-control/expansion-01/engine';
import { RULESET_MANIFEST } from '@balance-control/rules';
import type { EnginePackDefinition, PackManifest } from '@balance-control/game';
import { takeMeasure, playMeasure } from './measure-moves';

const EXP01_PACK_VERSION = (RULESET_MANIFEST.expansions.exp01Version ?? '0.0.0').replace(/^v/i, '');
const EXP01_PACK_MANIFEST: PackManifest = {
    id: 'exp01',
    packVersion: EXP01_PACK_VERSION,
    rulesetAnchor: `EXP-01 ${RULESET_MANIFEST.expansions.exp01Version ?? 'v0.0.0'}`,
    required: false,
};

/**
 * Engine Pack Definition for EXP-01.
 */
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
              preShuffle: (G: any, ctx: any) => Expansion01.onSetup?.(G, ctx),
          }
        : undefined,
};
