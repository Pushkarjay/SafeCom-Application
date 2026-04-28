import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
            '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
            '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
            '@routes': fileURLToPath(new URL('./src/routes', import.meta.url)),
            '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url))
        }
    },
    server: {
        port: 3000,
        open: true
    }
});
