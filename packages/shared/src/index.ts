export const Logger = {
    log: (msg: string) => console.log(`[LOG] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
    warn: (msg: string) => console.warn(`[WARN] ${msg}`),
};
