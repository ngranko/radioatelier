import {describe, expect, it} from 'vitest';
import {downsample, polylineFor} from './chartPath';
import type {LoadSample} from './loadSampler';

describe('chartPath', () => {
    it('keeps short series intact', () => {
        expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
    });

    it('samples evenly when downsampling', () => {
        expect(downsample([0, 1, 2, 3, 4], 3)).toEqual([0, 2, 4]);
    });

    it('returns a polyline when at least two values exist', () => {
        const samples: LoadSample[] = [
            {t: 0, frameMs: 8},
            {t: 16, frameMs: 24},
        ];
        const points = polylineFor(samples, sample => sample.frameMs, 100, 40);
        expect(points).toEqual('4.0,36.0 96.0,4.0');
    });

    it('returns null when a metric is missing', () => {
        const samples: LoadSample[] = [{t: 0, frameMs: 8}, {t: 16, frameMs: 8}];
        expect(polylineFor(samples, sample => sample.heapUsedMb, 100, 40)).toBeNull();
    });
});
