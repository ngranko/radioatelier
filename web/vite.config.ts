import {sveltekit} from '@sveltejs/kit/vite';
import {defineConfig} from 'vitest/config';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        cjsInterop({
            // Add broken npm package here
            dependencies: ['@googlemaps/js-api-loader', '@deck.gl/layers', '@deck.gl/google-maps'],
        }),
    ],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
    server: {
        host: true,
        allowedHosts: true,
        port: 5173,
        strictPort: true,
    },
});
