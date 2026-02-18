import type { ExpansionId, GameState } from '@balance-control/rules';
import { EnginePackRegistry } from '../expansion-registry';

export type MeasureDeckLookup = Readonly<{
    expansionId: ExpansionId;
    deckId: string;
    objectIdPrefix: string;
    drawPileId: string;
    openZoneId: string;
    recyclePileId: string;
    finalDiscardId: string;
}>;

/**
 * Looks up the measure deck descriptor for a given measure object ID.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function lookupMeasureDeckForObjectId(G: GameState, measureObjectId: string): MeasureDeckLookup {
    const candidates = EnginePackRegistry.getMeasureDeckDescriptors(G);
    const matches = candidates.filter(c => measureObjectId.startsWith(c.deck.objectIdPrefix));

    if (matches.length === 0) {
        throw new Error(`MeasureDeckLookup: no provider matches measureObjectId "${measureObjectId}".`);
    }

    if (matches.length > 1) {
        const lines = [
            `MeasureDeckLookup: multiple providers match measureObjectId "${measureObjectId}".`,
            'Matches:',
            ...matches.map(m => `- ${m.expansionId}/${m.deck.id} prefix="${m.deck.objectIdPrefix}"`)
        ];
        throw new Error(lines.join('\n'));
    }

    const match = matches[0];
    return {
        expansionId: match.expansionId,
        deckId: match.deck.id,
        objectIdPrefix: match.deck.objectIdPrefix,
        drawPileId: match.deck.zones.drawPileId,
        openZoneId: match.deck.zones.openZoneId,
        recyclePileId: match.deck.zones.recyclePileId,
        finalDiscardId: match.deck.zones.finalDiscardId
    };
}
