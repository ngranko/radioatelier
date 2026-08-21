import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import type {MarkerPoint} from './markerClusterIndex';
import {getLatestSpawnTime, popClock, stampSpawn} from './spriteSpawns';

function markerPoint(): MarkerPoint {
    return {kind: 'marker', position: [37.61, 55.75], marker: {} as Marker};
}

describe('spawn stamps', () => {
    it('stamps a marker once, so a cluster handing it back does not re-pop it', () => {
        const point = markerPoint();

        const first = stampSpawn(point.marker);
        getLatestSpawnTime([point]);

        expect(stampSpawn(point.marker)).toBe(first);
    });

    it('reports the newest stamp, which is how long the layer keeps animating', () => {
        const older = markerPoint();
        getLatestSpawnTime([older]);
        const newer = markerPoint();

        const newest = getLatestSpawnTime([older, newer]);

        expect(newest).toBe(stampSpawn(newer.marker));
        expect(newest).toBeGreaterThanOrEqual(stampSpawn(older.marker));
    });

    it('runs on the same page-relative clock the shader is given', () => {
        expect(stampSpawn(markerPoint().marker)).toBeLessThanOrEqual(popClock());
    });
});
