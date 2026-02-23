import { describe, it, expect } from 'vitest';
import { translate } from '../src/ui/i18n';

const REQUIRED_KEYS = [
    "core:group.influence",
    "core:group.committees",
    "core:group.economy",
    "core:group.measures",
    "core:group.expansions",
    "core:action.placeInfluence",
    "core:action.moveInfluence",
    "core:action.formalize",
    "core:action.convert",
    "core:action.takeMeasure",
    "core:step.chooseAction",
    "core:step.chooseSource",
    "core:step.chooseDestination",
    "core:step.chooseTile",
    "core:step.chooseVariant",
    "core:ui.preview",
    "core:ui.confirm",
    "core:ui.cancel",
    "core:ui.changeSource",
    "core:ui.changeDestination",
    "core:ui.changeVariant",
    "core:ui.moveRejectedTitle",
    "core:ui.moveRejectedBody",
    "core:ui.moveRejectedReason.missingMove",
    "core:ui.moveRejectedReason.invalidMove",
    "core:ui.moveRejectedReason.exception",
    "core:ui.moveRejectedReason.unknown",
    "core:draft.moveInfluenceSummary",
    "core:draft.placeInfluenceSummary",
    "core:draft.placeTileSummary",
    "core:draft.formalizeSummary",
    "core:draft.convertSummary",
    "core:inspector.activeAction",
    "core:inspector.step",
    "core:inspector.pinnedSource"
];

describe('I18N Required Keys Gate', () => {
    describe('English (en)', () => {
        REQUIRED_KEYS.forEach(key => {
            it(`should have a translation for ${key}`, () => {
                const translation = translate('en', key);
                expect(translation, `Missing EN translation for ${key}`).not.toBe(key);
                expect(translation).not.toBeUndefined();
                expect(typeof translation).toBe('string');
            });
        });
    });

    describe('German (de)', () => {
        REQUIRED_KEYS.forEach(key => {
            it(`should have a translation for ${key}`, () => {
                const translation = translate('de', key);
                expect(translation, `Missing DE translation for ${key}`).not.toBe(key);
                expect(translation).not.toBeUndefined();
                expect(typeof translation).toBe('string');
            });
        });
    });
});
