import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {cjsInterop} from 'vite-plugin-cjs-interop';
import {defineConfig} from 'vitest/config';

import packageJson from './package.json';

const commitSha = process.env.GIT_COMMIT_SHA?.trim().slice(0, 7) || 'local';

export default defineConfig({
    define: {
        __APP_SERVICE_VERSION__: JSON.stringify(`${packageJson.version}+${commitSha}`),
    },
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
