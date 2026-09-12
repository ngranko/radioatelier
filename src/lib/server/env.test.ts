import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
    bakedNames: [
        'PUBLIC_CONVEX_URL',
        'PUBLIC_GOOGLE_MAPS_API_KEY',
        'PUBLIC_GOOGLE_MAPS_MAP_ID',
        'PUBLIC_POSTHOG_HOST',
        'PUBLIC_POSTHOG_PROJECT_TOKEN',
    ],
    building: false,
    baked: {} as Record<string, string>,
    dynamicPrivate: {} as Record<string, string | undefined>,
    dynamicPublic: {} as Record<string, string | undefined>,
}));

vi.mock('$app/environment', () => ({
    get building() {
        return mocks.building;
    },
}));

// Module factories are evaluated once, so every export reads through a getter
// to keep seeing what the current test case set up.
vi.mock('$env/static/public', () =>
    Object.defineProperties(
        {},
        Object.fromEntries(
            mocks.bakedNames.map(name => [name, {enumerable: true, get: () => mocks.baked[name]}]),
        ),
    ),
);
vi.mock('$env/dynamic/private', () => ({
    get env() {
        return mocks.dynamicPrivate;
    },
}));
vi.mock('$env/dynamic/public', () => ({
    get env() {
        return mocks.dynamicPublic;
    },
}));

async function assertWithCurrentEnv() {
    vi.resetModules();
    const {assertServerEnv} = await import('./env');
    assertServerEnv();
}

beforeEach(() => {
    mocks.building = false;
    mocks.baked = {
        PUBLIC_CONVEX_URL: 'https://example.convex.cloud',
        PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-key',
        PUBLIC_GOOGLE_MAPS_MAP_ID: 'map-id',
        PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com',
        PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_token',
    };
    mocks.dynamicPrivate = {CLERK_SECRET_KEY: 'sk_test'};
    mocks.dynamicPublic = {PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test'};
});

describe('assertServerEnv', () => {
    it('passes when every variable is set', async () => {
        await expect(assertWithCurrentEnv()).resolves.toBeUndefined();
    });

    it('reports a baked variable that built as an empty string', async () => {
        mocks.baked.PUBLIC_CONVEX_URL = '';

        await expect(assertWithCurrentEnv()).rejects.toThrow(/build time.*PUBLIC_CONVEX_URL/s);
    });

    it('reports a runtime variable missing from the container', async () => {
        delete mocks.dynamicPrivate.CLERK_SECRET_KEY;

        await expect(assertWithCurrentEnv()).rejects.toThrow(/runtime.*CLERK_SECRET_KEY/s);
    });

    it('separates baked and runtime names so the remedy differs', async () => {
        mocks.baked.PUBLIC_POSTHOG_HOST = '   ';
        mocks.dynamicPublic.PUBLIC_CLERK_PUBLISHABLE_KEY = '';

        await expect(assertWithCurrentEnv()).rejects.toThrow(
            /build time.*PUBLIC_POSTHOG_HOST[\s\S]*runtime.*PUBLIC_CLERK_PUBLISHABLE_KEY/,
        );
    });

    it('stays out of the way during the build, which has no deployment secrets', async () => {
        mocks.building = true;
        mocks.baked.PUBLIC_CONVEX_URL = '';
        mocks.dynamicPrivate = {};

        await expect(assertWithCurrentEnv()).resolves.toBeUndefined();
    });
});
