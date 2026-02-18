export type ResourceType = 'DOM' | 'FOR' | 'INF' | string;

export type ResourceId = string;
export type CoreResort = 'DOM' | 'FOR' | 'INF';

/**
 * @deprecated Use CoreResort for core resources, or ResourceId for general use.
 * This enum leaks expansion resources (ECO, CLM, SEC) and will be removed in a future version.
 */
export enum CoreResources {
    DOM = 'DOM',
    FOR = 'FOR',
    INF = 'INF',
    ECO = 'ECO',
    CLM = 'CLM',
    SEC = 'SEC',
}
