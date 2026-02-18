import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@balance-control/expansion-01/engine': path.resolve(__dirname, '../expansion-01/src/engine/index.ts'),
            '@balance-control/expansion-02/engine': path.resolve(__dirname, '../expansion-02/src/engine/index.ts'),
            '@balance-control/expansion-03/engine': path.resolve(__dirname, '../expansion-03/src/engine/index.ts'),
            '@balance-control/expansion-01': path.resolve(__dirname, '../expansion-01/src/index.ts'),
            '@balance-control/expansion-02': path.resolve(__dirname, '../expansion-02/src/index.ts'),
            '@balance-control/expansion-03': path.resolve(__dirname, '../expansion-03/src/index.ts'),
            '@balance-control/rules': path.resolve(__dirname, '../rules/src/index.ts'),
            '@balance-control/game': path.resolve(__dirname, '../game/src/index.ts'),
        },
    },
});
