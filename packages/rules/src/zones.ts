import type { ZoneId } from './ids';

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



export interface Zone {
    id: ZoneId;
    name: string;
    items: string[];
}
