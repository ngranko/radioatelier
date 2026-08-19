import {describe, expect, it, vi} from 'vitest';
import {GPU_RENDERER_FLAG, resolveGpuRendererFlag} from './gpuRendererFlag';

describe('resolveGpuRendererFlag', () => {
    it.each([true, 'clustered'])('enables the GPU renderer for %s', async value => {
        const client = {
            getFeatureFlag: vi.fn(() => value),
            onFeatureFlags: vi.fn(),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(true);
        expect(client.getFeatureFlag).toHaveBeenCalledWith(GPU_RENDERER_FLAG);
        expect(client.onFeatureFlags).not.toHaveBeenCalled();
    });

    it('waits for unresolved flags and cleans up a synchronous subscription', async () => {
        let value: boolean | undefined;
        const unsubscribe = vi.fn();
        const client = {
            getFeatureFlag: vi.fn(() => value),
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
            getFeatureFlag: vi.fn(() => {
                throw new Error('flag client unavailable');
            }),
            onFeatureFlags: vi.fn(),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
        expect(client.onFeatureFlags).not.toHaveBeenCalled();
    });

    it('falls back when feature flag subscription throws', async () => {
        const client = {
            getFeatureFlag: vi.fn(() => undefined),
            onFeatureFlags: vi.fn(() => {
                throw new Error('subscription unavailable');
            }),
        };

        await expect(resolveGpuRendererFlag(client)).resolves.toBe(false);
    });

    it('falls back when the subscribed flag read throws', async () => {
        const getFeatureFlag = vi
            .fn<() => boolean | undefined>()
            .mockReturnValueOnce(undefined)
            .mockImplementationOnce(() => {
                throw new Error('flag read unavailable');
            });
        const client = {
            getFeatureFlag,
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
            getFeatureFlag: vi.fn(() => undefined),
            onFeatureFlags: vi.fn(() => vi.fn()),
        };

        const result = resolveGpuRendererFlag(client, 10);
        await vi.advanceTimersByTimeAsync(10);

        await expect(result).resolves.toBe(false);
        vi.useRealTimers();
    });
});
