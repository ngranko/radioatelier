import {sveltekit} from '@sveltejs/kit/vite';
import {defineConfig} from 'vitest/config';
import {cjsInterop} from 'vite-plugin-cjs-interop';

export default defineConfig({
    plugins: [
        sveltekit(),
        cjsInterop({
            // Add broken npm package here
            dependencies: ['@googlemaps/js-api-loader'],
        }),
    ],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
    },
});
