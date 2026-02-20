type JsonLike =
    | null
    | boolean
    | number
    | string
    | JsonLike[]
    | { [key: string]: JsonLike | undefined };

export function canonicalize(value: JsonLike): JsonLike {
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

export function canonicalJsonStringify(value: any): string {
    return JSON.stringify(canonicalize(value as JsonLike));
}
