import {afterEach, describe, expect, it, vi} from 'vitest';
import {LoadSampler} from './loadSampler';

function stubFrames() {
    const pending: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        pending.push(callback);
        return pending.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    return {
        advance(now: number) {
            const callback = pending.shift();
            callback?.(now);
        },
    };
}

describe('LoadSampler', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('skips the first animation frame so setup time is not a fake stall', () => {
        const frames = stubFrames();
        const sampler = new LoadSampler();
        sampler.start();
        const origin = performance.now();
        frames.advance(origin + 100);
        frames.advance(origin + 116);
        frames.advance(origin + 132);

        const samples = sampler.stop();
        expect(samples.map(sample => sample.frameMs)).toEqual([16, 16]);
        expect(samples[0]?.t).toBeGreaterThanOrEqual(116);
        expect(samples[1]?.t).toBeGreaterThan(samples[0]?.t ?? 0);
    });
});
