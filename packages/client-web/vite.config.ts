import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@balance-control/game': path.resolve(__dirname, '../game/src/index.ts'),
            '@balance-control/rules': path.resolve(__dirname, '../rules/src/index.ts'),
            '@balance-control/shared': path.resolve(__dirname, '../shared/src/index.ts'),
            '@balance-control/expansion-01': path.resolve(__dirname, '../expansion-01/src/index.ts'),
            '@balance-control/expansion-02': path.resolve(__dirname, '../expansion-02/src/index.ts'),
            '@balance-control/expansion-03': path.resolve(__dirname, '../expansion-03/src/index.ts'),
        }
    },
    test: {
        environment: 'jsdom'
    }
})
