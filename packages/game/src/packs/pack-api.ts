export { EffectResolver } from '../engine/resolver';
export { lookupMeasureDeckForObjectId } from '../engine/measure-deck-provider';
export { coreResourceAtoms } from '../engine/atoms/resource';
export { coreInfluenceAtoms } from '../engine/atoms/influence';
export { coreProductionAtoms } from '../engine/atoms/production';
export { coreMeasureAtoms } from '../engine/atoms/measure';
export { coreChoiceAtoms } from '../engine/atoms/choice';
export { coreHotspotAtoms } from '../engine/atoms/hotspot';
export { createCoreRulesAtoms } from '../engine/atoms/rules';
export { CoreMoves } from '../moves';
export { drawTileToStaging } from '../mechanics-draw';
export {
    getRoundSettlementResortTileOrder,
    runFinalRoundSettlement,
    allStartingInfluencePlaced,
    countPlayerInfluence,
    getInfluenceCap,
    hasInfluenceInSupply,
} from '../mechanics-turn';
export { validateSurfaceHash } from '../surface';
export { emitReplaySystemRecord, type ReplayHookOptions } from '../engine/replay-sink';
export { isAdjacent } from '../engine/topology';
export { computeMajority } from '../mechanics';
export { coordToString, getNeighbors, stringToCoord } from '../topology';
export { evaluateTileSelector } from '../engine/selectors';
export { EnginePackRegistry } from '../expansion-registry';
export { getPlayerMetaMarker, findObjectZoneId } from '../state-lookup';
export { getLegalGrassrootsOutputs } from '../mechanics/conversion';
export { selectDeterministicCostResourceIds } from '../engine/deterministic-cost';
export type { LegalIntent } from '../engine/legal-intents';
