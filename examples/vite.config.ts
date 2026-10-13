import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root,
    resolve: {
        alias: {
            'three-renderstats': resolve(root, '../src/index.ts'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(root, 'index.html'),
                worker: resolve(root, 'worker.html'),
            },
        },
    },
    server: {
        port: 5173,
    },
});
