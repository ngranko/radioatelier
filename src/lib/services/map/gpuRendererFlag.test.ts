import {describe, expect, it, vi} from 'vitest';
import {GPU_RENDERER_FLAG, resolveGpuRendererFlag} from './gpuRendererFlag';

describe('resolveGpuRendererFlag', () => {
    it('enables the GPU renderer when the flag is on', async () => {
        const client = {
            isFeatureEnabled: vi.fn(() => true),
            onFeatureFlags: vi.fn((callback: () => void) => {
                callback();
                return vi.fn();
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(true);
        expect(client.isFeatureEnabled).toHaveBeenCalledWith(GPU_RENDERER_FLAG);
    });

    it('keeps the legacy renderer when the flag is off', async () => {
        const client = {
            isFeatureEnabled: vi.fn(() => false),
            onFeatureFlags: vi.fn((callback: () => void) => {
                callback();
                return vi.fn();
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
    });

    it('waits for unresolved flags and cleans up a synchronous subscription', async () => {
        let value: boolean | undefined;
        const unsubscribe = vi.fn();
        const client = {
            isFeatureEnabled: vi.fn(() => value),
            onFeatureFlags: vi.fn((callback: () => void) => {
                value = true;
                callback();
                return unsubscribe;
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(true);
        expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it('falls back when the initial flag read throws', async () => {
        const client = {
            isFeatureEnabled: vi.fn(() => {
                throw new Error('flag client unavailable');
            }),
            onFeatureFlags: vi.fn((callback: () => void) => {
                callback();
                return vi.fn();
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
    });

    it('falls back when feature flag subscription throws', async () => {
        const client = {
            isFeatureEnabled: vi.fn(() => undefined),
            onFeatureFlags: vi.fn(() => {
                throw new Error('subscription unavailable');
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
    });

    it('falls back when the subscribed flag read throws', async () => {
        const isFeatureEnabled = vi
            .fn<() => boolean | undefined>()
            .mockReturnValueOnce(undefined)
            .mockImplementationOnce(() => {
                throw new Error('flag read unavailable');
            });
        const client = {
            isFeatureEnabled,
            onFeatureFlags: vi.fn((callback: () => void) => {
                callback();
                return vi.fn();
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
    });

    it('falls back to the legacy renderer when loading times out', async () => {
        vi.useFakeTimers();
        const client = {
            isFeatureEnabled: vi.fn(() => undefined),
            onFeatureFlags: vi.fn(() => vi.fn()),
        };

        const result = resolveGpuRendererFlag(client, 10);
        await vi.advanceTimersByTimeAsync(10);

        await expect(result).resolves.toBe(false);
        vi.useRealTimers();
    });
});
