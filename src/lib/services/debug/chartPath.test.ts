import {describe, expect, it} from 'vitest';
import {buildChart, downsample} from './chartPath';
import type {LoadSample} from './loadSampler';

describe('chartPath', () => {
    it('keeps short series intact', () => {
        expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
    });

    it('samples evenly when downsampling', () => {
        expect(downsample([0, 1, 2, 3, 4], 3)).toEqual([0, 2, 4]);
    });

    it('returns a single point when the limit is one', () => {
        expect(downsample([0, 1], 1)).toEqual([0]);
        expect(downsample([0, 1], 0)).toEqual([]);
    });

    it('builds a 0-based chart with stats and a reference line', () => {
        const samples: LoadSample[] = [
            {t: 0, frameMs: 8},
            {t: 16, frameMs: 24},
        ];
        const chart = buildChart(samples, sample => sample.frameMs, {reference: 16.7});

        expect(chart).toEqual(
            expect.objectContaining({
                min: 8,
                max: 24,
                avg: 16,
                durationMs: 16,
                yMin: 0,
                yMax: 24,
            }),
        );
        expect(chart?.polyline).toEqual('4.0,46.7 236.0,4.0');
        expect(chart?.refY).toBeCloseTo(23.5, 0);
    });

    it('keeps the 60fps budget on the scale when frames are faster', () => {
        const samples: LoadSample[] = [
            {t: 0, frameMs: 8},
            {t: 16, frameMs: 10},
        ];
        const chart = buildChart(samples, sample => sample.frameMs, {reference: 16.7});
        expect(chart?.yMax).toBe(16.7);
    });

    it('returns null when a metric is missing', () => {
        const samples: LoadSample[] = [
            {t: 0, frameMs: 8},
            {t: 16, frameMs: 8},
        ];
        expect(buildChart(samples, sample => sample.heapUsedMb)).toBeNull();
    });

    it('computes stats from every valid point and only downsamples the line', () => {
        const samples: LoadSample[] = Array.from({length: 200}, (_, index) => ({
            t: index,
            frameMs: 8,
            heapUsedMb: index === 1 ? 80 : 10,
        }));
        const chart = buildChart(samples, sample => sample.heapUsedMb);

        expect(chart).toEqual(
            expect.objectContaining({
                min: 10,
                max: 80,
                durationMs: 199,
            }),
        );
        expect(chart?.polyline.split(' ')).toHaveLength(80);
    });
});
