import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'boardgame.io/dist/cjs/client.js';
import { createBalanceControlGame, hashState } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';
import { CoreZoneName } from '@balance-control/rules';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLDEN_DIR = path.resolve(__dirname, '../test/golden');

function sortKeysDeep(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortKeysDeep);
    }
    if (obj !== null && typeof obj === 'object') {
        const sorted = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
                sorted[key] = sortKeysDeep(obj[key]);
            });
        return sorted;
    }
    return obj;
}

function applyPrelude(G, prelude) {
    if (!prelude || prelude.length === 0) return;
    for (const step of prelude) {
        if (step.action === 'stackDrawPileByType') {
            const drawPile = G.zones[CoreZoneName.DrawPile];
            if (!drawPile) continue;
            const count = Math.max(1, step.count ?? 1);
            for (let i = 0; i < count; i++) {
                const idx = drawPile.items.findIndex((tileId) => {
                    const tile = G.tiles[tileId];
                    if (!tile) return false;
                    if (step.tileType && tile.type !== step.tileType) return false;
                    if (step.resort && tile.resort !== step.resort) return false;
                    return true;
                });
                if (idx === -1) break;
                const [tileId] = drawPile.items.splice(idx, 1);
                drawPile.items.unshift(tileId);
            }
            continue;
        }
        if (step.action === 'seedResources') {
            const supplyId = `${CoreZoneName.PersonalSupply}:${step.playerId}`;
            const supply = G.zones[supplyId];
            if (!supply) continue;
            const count = Math.max(1, step.count ?? 1);
            for (let i = 0; i < count; i++) {
                const id = `pre_res_${step.playerId}_${step.resort}_${i + 1}`;
                if (G.objects[id]) continue;
                G.objects[id] = { id, type: 'Resource', resort: step.resort, owner: step.playerId };
                supply.items.push(id);
            }
            continue;
        }
        if (step.action === 'setMetaMarker') {
            const markerId = `meta_${step.playerId}`;
            const marker = G.objects[markerId];
            if (!marker) continue;
            for (const zone of Object.values(G.zones)) {
                const idx = zone.items.indexOf(markerId);
                if (idx >= 0) {
                    zone.items.splice(idx, 1);
                }
            }
            const targetZone = G.zones[step.zoneId];
            if (!targetZone) continue;
            targetZone.items.push(markerId);
            if (step.mode !== undefined) marker.mode = step.mode;
        }
    }
}

function resolveMoveArgs(G, move, args) {
    if (!args || args.length === 0) return args;
    return args.map((arg) => {
        if (!arg || typeof arg !== 'object') return arg;
        if (move === 'moveInfluence') {
            const { sourceCoord, targetCoord, ...rest } = arg;
            const sourceId = sourceCoord ? G.grid[sourceCoord] : rest.sourceId;
            const targetId = targetCoord ? G.grid[targetCoord] : rest.targetId;
            return { ...rest, sourceId, targetId };
        }
        if (move === 'placeInfluence') {
            const { targetCoord, ...rest } = arg;
            const targetTileId = targetCoord ? G.grid[targetCoord] : rest.targetTileId;
            return { ...rest, targetTileId };
        }
        if (move === 'convertResources') {
            const { grassrootsCoord, ...rest } = arg;
            const grassrootsTileId = grassrootsCoord ? G.grid[grassrootsCoord] : rest.grassrootsTileId;
            return { ...rest, grassrootsTileId };
        }
        if (move === 'formalizeInfluence') {
            const { committeeCoord, ...rest } = arg;
            const committeeTileId = committeeCoord ? G.grid[committeeCoord] : rest.committeeTileId;
            return { ...rest, committeeTileId };
        }
        return arg;
    });
}

function buildReplayGame(seed, numPlayers, config, prelude) {
    const baseGame = createBalanceControlGame();
    return {
        ...baseGame,
        seed,
        playerView: ({ G }) => G,
        setup: (ctx) => {
            if (!ctx.numPlayers) {
                ctx.numPlayers = numPlayers;
            }
            const G = baseGame.setup(ctx, config);

            // FORCE-FIX: Existing goldens were recorded with player 0 starting.
            // By forcing 0 here, we maintain stability for old fixtures while
            // the RNG state remains advanced by the canonical SetupGame call.
            G.engine.attributes.startingPlayerIndex = 0;

            applyPrelude(G, prelude);
            return G;
        },
    };
}

async function run() {
    const isWrite = process.argv.includes('--write');
    const isCheck = process.argv.includes('--check');

    if (!isWrite && !isCheck) {
        console.error('Usage: node update-golden.mjs [--write | --check]');
        process.exit(1);
    }

    const files = readdirSync(GOLDEN_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();

    let hasMismatch = false;

    for (const file of files) {
        const filePath = path.join(GOLDEN_DIR, file);
        const fixture = JSON.parse(readFileSync(filePath, 'utf8'));

        console.log(`Replaying ${file}...`);

        registerCanonicalPacks();

        const game = buildReplayGame(fixture.seed, fixture.numPlayers, fixture.config, fixture.prelude);
        const client = Client({
            game,
            numPlayers: fixture.numPlayers,
        });
        client.start();

        for (const step of fixture.moves) {
            const state = client.getState();
            client.updatePlayerID(state.ctx.currentPlayer);
            const resolvedArgs = resolveMoveArgs(state.G, step.move, step.args);
            const moveFn = client.moves[step.move];
            if (typeof moveFn !== 'function') {
                throw new Error(`Move ${step.move} not found in fixture ${file}`);
            }
            moveFn(...resolvedArgs);
        }

        const state = client.getState();
        const actualHash = hashState(state.G);
        const actualPublicSurfaceHash = state.G.meta?.publicSurfaceHash;

        const changed =
            fixture.expectedFinalHash !== actualHash ||
            fixture.expectedPublicSurfaceHash !== actualPublicSurfaceHash;

        if (changed) {
            console.warn(`Mismatch in ${file}:`);
            if (fixture.expectedFinalHash !== actualHash) {
                console.warn(`  Hash: expected ${fixture.expectedFinalHash}, got ${actualHash}`);
            }
            if (fixture.expectedPublicSurfaceHash !== actualPublicSurfaceHash) {
                console.warn(`  Public Hash: expected ${fixture.expectedPublicSurfaceHash}, got ${actualPublicSurfaceHash}`);
            }
            hasMismatch = true;

            if (isWrite) {
                fixture.expectedFinalHash = actualHash;
                fixture.expectedPublicSurfaceHash = actualPublicSurfaceHash;
                const sorted = sortKeysDeep(fixture);
                writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
                console.log(`  Updated ${file}.`);
            }
        } else {
            // Even if not changed, we might want to normalize the formatting if in write mode
            if (isWrite) {
                const sorted = sortKeysDeep(fixture);
                const output = JSON.stringify(sorted, null, 2) + '\n';
                const original = readFileSync(filePath, 'utf8');
                if (output !== original) {
                    writeFileSync(filePath, output);
                    console.log(`  Normalized formatting for ${file}.`);
                }
            }
            console.log(`  ${file} is up to date.`);
        }
    }

    if (isCheck && hasMismatch) {
        console.error('Check failed: Some golden fixtures are stale.');
        process.exit(1);
    }

    console.log('Done.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
