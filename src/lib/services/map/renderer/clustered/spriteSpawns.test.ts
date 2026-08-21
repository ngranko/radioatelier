import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import type {MarkerPoint} from './markerClusterIndex';
import {findLatestSpawn, readPopTime, readSpawnTime} from './spriteSpawns';

function createMarkerPoint(): MarkerPoint {
    return {kind: 'marker', position: [37.61, 55.75], marker: {} as Marker};
}

describe('spawn stamps', () => {
    it('stamps a marker once, so a cluster handing it back does not re-pop it', () => {
        const point = createMarkerPoint();

        const first = readSpawnTime(point.marker);
        findLatestSpawn([point]);

        expect(readSpawnTime(point.marker)).toBe(first);
    });

    it('reports the newest stamp, which is how long the layer keeps animating', () => {
        const older = createMarkerPoint();
        findLatestSpawn([older]);
        const newer = createMarkerPoint();

        const newest = findLatestSpawn([older, newer]);

        expect(newest).toBe(readSpawnTime(newer.marker));
        expect(newest).toBeGreaterThanOrEqual(readSpawnTime(older.marker));
    });

    it('runs on the same page-relative clock the shader is given', () => {
        expect(readSpawnTime(createMarkerPoint().marker)).toBeLessThanOrEqual(readPopTime());
    });
});
