import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import type {MarkerPoint} from './markerClusterIndex';
import {latestSpawnTime, popClock, spawnStamp} from './spriteSpawns';

function markerPoint(): MarkerPoint {
    return {kind: 'marker', position: [37.61, 55.75], marker: {} as Marker};
}

describe('spawn stamps', () => {
    it('stamps a marker once, so a cluster handing it back does not re-pop it', () => {
        const point = markerPoint();

        const first = spawnStamp(point.marker);
        latestSpawnTime([point]);

        expect(spawnStamp(point.marker)).toBe(first);
    });

    it('reports the newest stamp, which is how long the layer keeps animating', () => {
        const older = markerPoint();
        latestSpawnTime([older]);
        const newer = markerPoint();

        const newest = latestSpawnTime([older, newer]);

        expect(newest).toBe(spawnStamp(newer.marker));
        expect(newest).toBeGreaterThanOrEqual(spawnStamp(older.marker));
    });

    it('runs on the same page-relative clock the shader is given', () => {
        expect(spawnStamp(markerPoint().marker)).toBeLessThanOrEqual(popClock());
    });
});
