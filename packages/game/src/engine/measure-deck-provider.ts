import type { ExpansionId, GameState } from '@balance-control/rules';
import { ExpansionRegistry } from '../expansion-registry';

export type MeasureDeckLookup = Readonly<{
    expansionId: ExpansionId;
    deckId: string;
    objectIdPrefix: string;
    drawPileId: string;
    openZoneId: string;
    recyclePileId: string;
    finalDiscardId: string;
}>;

export function lookupMeasureDeckForObjectId(G: GameState, measureObjectId: string): MeasureDeckLookup {
    const candidates = ExpansionRegistry.getMeasureDeckDescriptors(G);
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

