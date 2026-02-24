import type { ZoneId } from './ids';

/**
 * Core zone names defining the primary object containers.
 * @rule CORE-01-00-03
 * @rule CORE-01-00-04
 * @rule CORE-01-00-05
 */
export enum CoreZoneName {
    DrawPile = 'DrawPile',
    DiscardFaceUp = 'DiscardFaceUp',
    Board = 'Board',
    Bank = 'Bank',
    Noise = 'Noise',
    PersonalSupply = 'PersonalSupply',
    PlayerHand = 'PlayerHand',
    SelectionStaging = 'SelectionStaging'
}

/**
 * Zones are containers for game objects.
 * @rule CORE-01-00-02
 * @rule CORE-01-00-05A
 */
export interface Zone {
    id: ZoneId;
    name: string;
    items: string[];
}
