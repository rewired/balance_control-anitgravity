import { Server, Origins } from 'boardgame.io/server';
import type { ReplayRecord } from '@balance-control/game';
import { createServerGame } from './boot';
import { createReplaySink, readReplayDirectoryFromEnv } from './replay-logging';

const replaySink = createReplaySink({ replayDirectory: readReplayDirectoryFromEnv() });
const BalanceControl = createServerGame(replaySink);

const server = Server({
    games: [BalanceControl],
    origins: [Origins.LOCALHOST],
});

const serverApp = (server as any).app;

if (serverApp?.use) {
    serverApp.use(async (ctx: any, next: () => Promise<void>) => {
    if (ctx.path !== '/api/replay/hotseat' || ctx.method !== 'POST') {
        await next();
        return;
    }

    try {
        const body = await new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            ctx.req.on('data', (chunk: Buffer) => chunks.push(chunk));
            ctx.req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            ctx.req.on('error', reject);
        });

        const parsed = JSON.parse(body) as ReplayRecord;
        replaySink.writeRecord(parsed);
        ctx.status = 204;
    }
    catch (error) {
        console.error('[ReplayLogger] Failed to ingest hotseat replay record', error);
        ctx.status = 400;
        ctx.body = { error: 'invalid replay record payload' };
    }
    });
}

server.run(8000);
