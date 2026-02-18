import { describe, it, expect } from 'vitest';
import { normalizeGameConfig } from '../src/config';

describe('normalizeGameConfig', () => {
    it('should derive expansions from flags when packs not provided', () => {
        const config = normalizeGameConfig({ expansions: { ex01: true, ex02: false, ex03: false } });
        expect(config.expansions.ex01).toBe(true);
        expect(config.expansions.ex02).toBe(false);
        expect(config.expansions.ex03).toBe(false);
        expect(config.packs?.enabledPacks).toEqual(['exp01']);
    });

    it('should derive enabledPacks from packs.enabledPacks', () => {
        const config = normalizeGameConfig({ packs: { enabledPacks: ['exp02'] } });
        expect(config.packs?.enabledPacks).toEqual(['exp02']);
        expect(config.expansions.ex01).toBe(false);
        expect(config.expansions.ex02).toBe(true);
        expect(config.expansions.ex03).toBe(false);
    });

    it('should prioritize packs.enabledPacks over flags if both provided (reconciliation)', () => {
        const config = normalizeGameConfig({
            expansions: { ex01: false, ex02: true, ex03: true },
            packs: { enabledPacks: ['exp01'] }
        });
        // Packs says exp01 only. Flags says ex02, ex03. Packs should win.
        expect(config.packs?.enabledPacks).toEqual(['exp01']);
        expect(config.expansions.ex01).toBe(true);
        expect(config.expansions.ex02).toBe(false);
        expect(config.expansions.ex03).toBe(false);
    });

    it('should handle legacy config structure', () => {
        const config = normalizeGameConfig({ config: { expansions: { ex01: true } } });
        expect(config.expansions.ex01).toBe(true);
        expect(config.packs?.enabledPacks).toEqual(['exp01']);
    });
});
