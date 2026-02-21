import { describe, it, expect } from 'vitest';
import { translate } from '../src/ui/i18n';

describe('I18N Module', () => {
    describe('translate function', () => {
        it('should translate a key in EN', () => {
            expect(translate('en', 'core:ui.confirm')).toBe('Confirm');
        });

        it('should translate a key in DE', () => {
            expect(translate('de', 'core:ui.confirm')).toBe('Bestätigen');
        });

        it('should return the key if it is missing in both EN and DE', () => {
            expect(translate('en', 'core:nonexistent.key')).toBe('core:nonexistent.key');
            expect(translate('de', 'core:nonexistent.key')).toBe('core:nonexistent.key');
        });

        it('should support {{var}} interpolation', () => {
            expect(translate('en', 'core:draft.moveInfluenceSummary', { source: 'A', target: 'B' }))
                .toBe('A → B');
            expect(translate('de', 'core:draft.moveInfluenceSummary', { source: 'A', target: 'B' }))
                .toBe('A → B');

            expect(translate('en', 'core:draft.placeInfluenceSummary', { target: 'X' }))
                .toBe('target X');
            expect(translate('de', 'core:draft.placeInfluenceSummary', { target: 'X' }))
                .toBe('Ziel X');
        });

        it('should handle missing namespaces gracefully', () => {
            expect(translate('en', 'nonexistent:key')).toBe('nonexistent:key');
        });

        it('should handle malformed keys gracefully', () => {
            expect(translate('en', 'malformedkey')).toBe('malformedkey');
        });

        it('should handle nested paths correctly', () => {
            expect(translate('en', 'core:group.influence')).toBe('Influence');
            expect(translate('de', 'core:group.influence')).toBe('Einfluss');
        });
    });
});
