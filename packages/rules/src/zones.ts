import type { ZoneId } from './ids';

export enum CoreZoneNames {
    DrawPile = 'DrawPile',
    DiscardFaceUp = 'DiscardFaceUp',
    Board = 'Board',
    Bank = 'Bank',
    Noise = 'Noise',
    PersonalSupply = 'PersonalSupply', // Use with :pid
    PlayerHand = 'PlayerHand',     // Use with :pid
    SelectionStaging = 'SelectionStaging',
    // Expansion 01 Zones
    MeasureDrawPile = 'MeasureDrawPile',
    OpenMeasures = 'OpenMeasures',
    MeasureRecyclePile = 'MeasureRecyclePile',
    MeasureFinalDiscard = 'MeasureFinalDiscard',
    // Expansion 02 Zones
    RegulationSupply = 'RegulationSupply',
    BoardAttached = 'BoardAttached',
    EXP02_MeasureDrawPile = 'EXP02_MeasureDrawPile',
    EXP02_OpenMeasures = 'EXP02_OpenMeasures',
    EXP02_MeasureRecyclePile = 'EXP02_MeasureRecyclePile',
    EXP02_MeasureFinalDiscard = 'EXP02_MeasureFinalDiscard',
    // Expansion 03 Zones
    CountdownSupply = 'CountdownSupply',
    EXP03_MeasureDrawPile = 'EXP03_MeasureDrawPile',
    EXP03_OpenMeasures = 'EXP03_OpenMeasures',
    EXP03_MeasureRecyclePile = 'EXP03_MeasureRecyclePile',
    EXP03_MeasureFinalDiscard = 'EXP03_MeasureFinalDiscard'
}

export interface Zone {
    id: ZoneId;
    name: string;
    items: string[];
}
