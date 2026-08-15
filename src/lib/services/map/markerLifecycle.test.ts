import {afterEach, describe, expect, it} from 'vitest';
import {MarkerLifecycle} from './markerLifecycle';

describe('MarkerLifecycle', () => {
    afterEach(() => {
        lifecycle.reset();
    });

    const lifecycle = new MarkerLifecycle();

    it('is idle until work begins', () => {
        expect(lifecycle.isIdle).toBe(true);
        lifecycle.begin();
        expect(lifecycle.isIdle).toBe(false);
        lifecycle.end();
        expect(lifecycle.isIdle).toBe(true);
    });

    it('stays busy while nested work is in flight', () => {
        lifecycle.begin();
        lifecycle.begin();
        lifecycle.end();
        expect(lifecycle.isIdle).toBe(false);
        lifecycle.end();
        expect(lifecycle.isIdle).toBe(true);
    });

    it('resolves waiters after a quiet period', async () => {
        lifecycle.begin();
        const pending = lifecycle.waitUntilIdle({quietMs: 15, timeoutMs: 1000});
        lifecycle.end();
        await pending;
        expect(lifecycle.isIdle).toBe(true);
    });

    it('times out if work never finishes', async () => {
        lifecycle.begin();
        await expect(lifecycle.waitUntilIdle({quietMs: 1, timeoutMs: 20})).rejects.toThrow(
            'Timed out waiting for marker pipeline',
        );
    });
});
