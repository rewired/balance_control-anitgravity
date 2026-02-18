import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

type JsonLike =
    | null
    | boolean
    | number
    | string
    | JsonLike[]
    | { [key: string]: JsonLike | undefined };

function canonicalize(value: JsonLike): JsonLike {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => canonicalize(entry as JsonLike));
    }

    const input = value as { [key: string]: JsonLike | undefined };
    const ordered: { [key: string]: JsonLike } = {};
    const keys = Object.keys(input).sort();

    for (const key of keys) {
        const entry = input[key];
        if (entry !== undefined) {
            ordered[key] = canonicalize(entry);
        }
    }

    return ordered;
}

/**
 * Canonical JSON stringification for deterministic hashing.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function canonicalJsonStringify(value: JsonLike): string {
    return JSON.stringify(canonicalize(value));
}

/**
 * Hashes the game state for determinism verification.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function hashState(G: JsonLike): string {
    const utf8 = new TextEncoder().encode(canonicalJsonStringify(G));
    return bytesToHex(sha256(utf8));
}
