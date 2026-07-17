import adapter from '@sveltejs/adapter-node';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const packageJson = JSON.parse(
    readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    kit: {
        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        adapter: adapter(),
        alias: {
            $convex: 'src/convex',
            '$convex/*': 'src/convex/*',
        },
        // Required for PostHog session replay to work correctly with SSR
        paths: {
            relative: false,
        },
        version: {
            name: packageJson.version,
        },
    },
};

export default config;
