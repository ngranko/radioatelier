import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import type {MarkerPoint} from './markerClusterIndex';
import {findLatestPop, readPopNow, readPopTime} from './spritePopTimes';

function createMarkerPoint(): MarkerPoint {
    return {kind: 'marker', position: [37.61, 55.75], marker: {} as Marker};
}

describe('pop stamps', () => {
    it('stamps a marker once, so a cluster handing it back does not re-pop it', () => {
        const point = createMarkerPoint();

        const first = readPopTime(point.marker);
        findLatestPop([point]);

        expect(readPopTime(point.marker)).toBe(first);
    });

    it('reports the newest stamp, which is how long the layer keeps animating', () => {
        const older = createMarkerPoint();
        findLatestPop([older]);
        const newer = createMarkerPoint();

        const newest = findLatestPop([older, newer]);

        expect(newest).toBe(readPopTime(newer.marker));
        expect(newest).toBeGreaterThanOrEqual(readPopTime(older.marker));
    });

    it('runs on the same page-relative clock the shader is given', () => {
        expect(readPopTime(createMarkerPoint().marker)).toBeLessThanOrEqual(readPopNow());
    });
});
