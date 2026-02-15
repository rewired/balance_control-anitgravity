export type LastSession = {
    matchID: string;
    playerID: string;
    credentials: string;
    playerName: string;
    serverUrl: string;
};

const LAST_SESSION_STORAGE_KEY = 'bc:lobby:lastSession';

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function readLocalStorageRaw(key: string): string | null {
    try {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeLocalStorageRaw(key: string, value: string): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

function removeLocalStorageRaw(key: string): void {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

export function readLastSession(): LastSession | null {
    const raw = readLocalStorageRaw(LAST_SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed)) return null;
        const { matchID, playerID, credentials, playerName, serverUrl } = parsed;
        if (!isString(matchID) || !isString(playerID) || !isString(credentials) || !isString(playerName) || !isString(serverUrl)) {
            return null;
        }
        return { matchID, playerID, credentials, playerName, serverUrl };
    } catch {
        return null;
    }
}

export function writeLastSession(session: LastSession): void {
    writeLocalStorageRaw(LAST_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearLastSession(): void {
    removeLocalStorageRaw(LAST_SESSION_STORAGE_KEY);
}

