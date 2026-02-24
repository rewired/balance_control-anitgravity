import { describe, it, expect } from 'vitest';
import { isExecutableEvidence, validateRegistry } from '../audit-core-obligations.mjs';

describe('isExecutableEvidence', () => {
    it('identifies test files as executable', () => {
        expect(isExecutableEvidence('packages/game/test/foo.test.ts')).toBe(true);
        expect(isExecutableEvidence('scripts/__tests__/bar.test.mjs')).toBe(true);
    });

    it('identifies invariant files as executable', () => {
        expect(isExecutableEvidence('packages/rules/src/state-invariants.ts')).toBe(true);
        expect(isExecutableEvidence('packages/game/src/engine/invariants.mjs')).toBe(true);
    });

    it('identifies golden fixtures as executable', () => {
        expect(isExecutableEvidence('packages/integration-tests/test/golden/core_placement.json')).toBe(true);
    });

    it('rejects plain source files', () => {
        expect(isExecutableEvidence('packages/game/src/index.ts')).toBe(false);
        expect(isExecutableEvidence('packages/rules/src/resources.ts')).toBe(false);
    });

    it('is case-insensitive', () => {
        expect(isExecutableEvidence('FOO.TEST.TS')).toBe(true);
    });
});

describe('validateRegistry quality gate', () => {
    it('categorizes OK when normative has executable evidence', () => {
        const registry = {
            entries: [{
                id: 'CORE-01-01-01',
                class: 'NORMATIVE_ENGINE',
                evidenceRequired: true,
                evidence: ['packages/game/test/core-compliance-invariants.test.ts']
            }]
        };
        const result = validateRegistry(registry, new Map([['CORE-01-01-01', 't']]));
        expect(result.qualityStats.OK).toBe(1);
        expect(result.weakEvidence).toHaveLength(0);
    });

    it('categorizes WEAK when normative has only source evidence', () => {
        const registry = {
            entries: [{
                id: 'CORE-01-01-01',
                class: 'NORMATIVE_ENGINE',
                evidenceRequired: true,
                evidence: ['packages/game/src/index.ts']
            }]
        };
        const result = validateRegistry(registry, new Map([['CORE-01-01-01', 't']]));
        expect(result.qualityStats.WEAK).toBe(1);
        expect(result.weakEvidence).toContain('CORE-01-01-01');
    });

    it('categorizes MISSING when normative has no evidence', () => {
        const registry = {
            entries: [{
                id: 'CORE-01-01-01',
                class: 'NORMATIVE_ENGINE',
                evidenceRequired: true,
                evidence: []
            }]
        };
        const result = validateRegistry(registry, new Map([['CORE-01-01-01', 't']]));
        expect(result.qualityStats.MISSING).toBe(1);
        expect(result.normativeMissingEvidence).toContain('CORE-01-01-01');
    });

    it('categorizes SUSPECT when evidence contains orphans', () => {
        const registry = {
            entries: [{
                id: 'CORE-01-01-01',
                class: 'NORMATIVE_ENGINE',
                evidenceRequired: true,
                evidence: ['nonexistent-file.ts']
            }]
        };
        const result = validateRegistry(registry, new Map([['CORE-01-01-01', 't']]));
        expect(result.qualityStats.SUSPECT).toBe(1);
        expect(result.evidenceOrphans).toHaveLength(1);
    });
});
