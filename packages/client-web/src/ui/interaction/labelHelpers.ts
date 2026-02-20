import type { GameState } from '@balance-control/rules';

/**
 * Helper to get a human-readable label for a game object ID (Resource or Measure).
 * @remarks Presentation-only.
 */
export const getObjectLabel = (G: GameState, objectId: string): string => {
    const obj = G.objects[objectId];
    if (!obj) return objectId;
    if (obj.type === 'Resource') {
        return obj.resort || objectId;
    }
    if (obj.type === 'Measure') {
        return obj.measureId || objectId;
    }
    return objectId;
};
