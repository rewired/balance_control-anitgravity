export interface RulesetManifest {
    coreVersion: string;
    expansions: {
        exp01Version?: string;
        exp02Version?: string;
        exp03Version?: string;
    };
    specAnchorHash?: string;
}

export const RULESET_MANIFEST: RulesetManifest = {
    coreVersion: 'v1.1.0',
    expansions: {
        exp01Version: 'v1.3',
        exp02Version: 'v1.0',
        exp03Version: 'v1.0',
    },
    specAnchorHash: '5F563AFF09ADCAF45B62E5CBBB97C5DC5D722EE2B56E3AB67B7B71BEA2F9FEF3',
};
