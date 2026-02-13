import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@balance-control/game': path.resolve(__dirname, '../game/src/client-game.ts'),
            '@balance-control/rules': path.resolve(__dirname, '../rules/src/index.ts'),
            '@balance-control/shared': path.resolve(__dirname, '../shared/src/index.ts'),
        }
    },
    test: {
        environment: 'jsdom'
    }
})
