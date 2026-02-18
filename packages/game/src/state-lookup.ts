/**
 * Returns the player's meta marker object.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function getPlayerMetaMarker(G: any, playerId: string): any | null {
    const directId = `meta_${playerId}`;
    const objects = (G?.objects ?? {}) as Record<string, any>;

    const direct = objects[directId];
    if (direct && direct.type === 'MetaMarker') return direct;

    for (const obj of Object.values(objects)) {
        if (obj && obj.type === 'MetaMarker' && obj.owner === playerId) return obj;
    }

    return null;
}

/**
 * Finds the zone ID containing the specified object.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function findObjectZoneId(G: any, objectId: string): string | null {
    const zones = (G?.zones ?? {}) as Record<string, any>;
    for (const zone of Object.values(zones)) {
        if (zone?.items?.includes(objectId)) return zone.id;
    }
    return null;
}
