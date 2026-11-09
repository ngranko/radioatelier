import {afterEach, describe, expect, it} from 'vitest';
import {MarkerLifecycle} from './markerLifecycle';

describe('MarkerLifecycle', () => {
    afterEach(() => {
        lifecycle.reset();
    });

    const lifecycle = new MarkerLifecycle();

    it('stays busy while nested work is in flight', () => {
        lifecycle.begin();
        lifecycle.begin();
        lifecycle.end();
        expect(lifecycle.isIdle).toBe(false);
        lifecycle.end();
        expect(lifecycle.isIdle).toBe(true);
    });

    it('times out if work never finishes', async () => {
        lifecycle.begin();
        await expect(lifecycle.waitUntilIdle({quietMs: 1, timeoutMs: 20})).rejects.toThrow(
            'Timed out waiting for marker pipeline',
        );
    });

    it('restarts the quiet period if work starts and finishes during it', async () => {
        const pending = lifecycle.waitUntilIdle({quietMs: 40, timeoutMs: 1000});
        await new Promise(resolve => setTimeout(resolve, 10));
        lifecycle.begin();
        lifecycle.end();
        const afterWork = performance.now();
        await pending;
        expect(performance.now() - afterWork).toBeGreaterThanOrEqual(35);
    });
});
