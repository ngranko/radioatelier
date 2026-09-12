import {building} from '$app/environment';
import {env as privateEnv} from '$env/dynamic/private';
import {env as publicEnv} from '$env/dynamic/public';
import {
    PUBLIC_CONVEX_URL,
    PUBLIC_GOOGLE_MAPS_API_KEY,
    PUBLIC_GOOGLE_MAPS_MAP_ID,
    PUBLIC_POSTHOG_HOST,
    PUBLIC_POSTHOG_PROJECT_TOKEN,
} from '$env/static/public';

// Vite bakes these in at build time. A name missing from the build environment
// already fails the build, but an empty value passes it and then surfaces as a
// 500 from whichever request first touches the consumer, so they are re-checked.
const bakedVariables = {
    PUBLIC_CONVEX_URL,
    PUBLIC_GOOGLE_MAPS_API_KEY,
    PUBLIC_GOOGLE_MAPS_MAP_ID,
    PUBLIC_POSTHOG_HOST,
    PUBLIC_POSTHOG_PROJECT_TOKEN,
};

// `svelte-clerk` resolves both through `$env/dynamic/*`, so they are read from
// the container on every request and are invisible to the build.
function readRuntimeVariables() {
    return {
        CLERK_SECRET_KEY: privateEnv.CLERK_SECRET_KEY,
        PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY,
    };
}

function collectBlankNames(variables: Record<string, string | undefined>) {
    return Object.entries(variables)
        .filter(([, value]) => !value?.trim())
        .map(([name]) => name);
}

function describeBlankNames(baked: string[], runtime: string[]) {
    const lines = ['Server not started, required environment variables are missing or empty:'];
    if (baked.length > 0) {
        lines.push(`  baked at build time (set for the build, then rebuild): ${baked.join(', ')}`);
    }
    if (runtime.length > 0) {
        lines.push(`  read at runtime (set on the service, then restart): ${runtime.join(', ')}`);
    }
    return lines.join('\n');
}

export function assertServerEnv() {
    // The image is built without deployment secrets, so this belongs to the
    // running server rather than to `vite build`.
    if (building) {
        return;
    }

    const baked = collectBlankNames(bakedVariables);
    const runtime = collectBlankNames(readRuntimeVariables());
    if (baked.length === 0 && runtime.length === 0) {
        return;
    }

    throw new Error(describeBlankNames(baked, runtime));
}
