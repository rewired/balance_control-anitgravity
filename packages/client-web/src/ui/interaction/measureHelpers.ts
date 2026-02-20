import type { LegalIntent } from '@balance-control/game';

export interface MeasureGroup {
    expansionId: string;
    intents: LegalIntent[];
}

/**
 * Groups takeMeasure intents by expansion prefix (e.g. "exp01.takeMeasure" -> "exp01").
 * @remarks Presentation-only.
 */
export function groupMeasureIntents(intents: LegalIntent[]): MeasureGroup[] {
    const measureIntents = intents.filter((i) => i.moveType.endsWith('.takeMeasure'));
    const byExpansion = new Map<string, LegalIntent[]>();

    for (const intent of measureIntents) {
        const expansionId = intent.moveType.split('.')[0];
        if (!byExpansion.has(expansionId)) {
            byExpansion.set(expansionId, []);
        }
        byExpansion.get(expansionId)!.push(intent);
    }

    const result: MeasureGroup[] = [];
    for (const [expansionId, expansionIntents] of byExpansion.entries()) {
        result.push({
            expansionId,
            intents: [...expansionIntents].sort((a, b) => String(a.payload).localeCompare(String(b.payload)))
        });
    }

    return result.sort((a, b) => a.expansionId.localeCompare(b.expansionId));
}
