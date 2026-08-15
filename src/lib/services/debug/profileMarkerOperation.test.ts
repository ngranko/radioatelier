import {afterEach, describe, expect, it, vi} from 'vitest';
import type {LoadSample} from './loadSampler';

const {waitUntilIdle} = vi.hoisted(() => ({
    waitUntilIdle: vi.fn(),
}));

vi.mock('svelte', () => ({
    tick: async () => {},
}));

vi.mock('$lib/services/map/markerLifecycle', () => ({
    markerLifecycle: {
        waitUntilIdle,
    },
}));

vi.mock('./loadSampler', () => {
    const samples: LoadSample[] = [{t: 0, frameMs: 16}];
    return {
        LoadSampler: class {
            public start() {}
            public stop() {
                return samples;
            }
        },
    };
});

import {profileMarkerOperation} from './profileMarkerOperation';

describe('profileMarkerOperation', () => {
    afterEach(() => {
        waitUntilIdle.mockReset();
    });

    it('measures from run() until the pipeline is idle', async () => {
        waitUntilIdle.mockResolvedValue(undefined);
        const run = vi.fn();

        const result = await profileMarkerOperation({
            operation: 'add',
            markerCount: 10,
            renderer: 'dom',
            run,
        });

        expect(run).toHaveBeenCalledOnce();
        expect(result.timedOut).toBe(false);
        expect(result.markerCount).toBe(10);
        expect(result.samples).toHaveLength(1);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('records a timeout without throwing', async () => {
        waitUntilIdle.mockRejectedValue(new Error('Timed out waiting for marker pipeline'));

        const result = await profileMarkerOperation({
            operation: 'remove',
            markerCount: 4,
            renderer: 'deck',
            run: () => {},
        });

        expect(result.timedOut).toBe(true);
        expect(result.operation).toBe('remove');
        expect(result.renderer).toBe('deck');
    });

    it('does not treat run() failures as pipeline timeouts', async () => {
        await expect(
            profileMarkerOperation({
                operation: 'add',
                markerCount: 1,
                renderer: 'dom',
                run: () => {
                    throw new Error('Timed out waiting for marker pipeline');
                },
            }),
        ).rejects.toThrow('Timed out waiting for marker pipeline');
        expect(waitUntilIdle).not.toHaveBeenCalled();
    });
});
