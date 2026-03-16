import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import {defineConfig} from 'vitest/config';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        cjsInterop({
            // Add broken npm packages here
            dependencies: ['@googlemaps/js-api-loader', '@mapbox/tiny-sdf'],
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
