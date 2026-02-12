declare module 'boardgame.io/server' {
    export const Origins: {
        LOCALHOST: string;
    };

    export function Server(config: any): {
        run(port: number): void;
    };
}
