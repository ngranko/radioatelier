import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import type {MarkerPoint} from './markerClusterIndex';
import {popClock, registerSpawns, spawnTimeFor} from './spriteSpawns';

function markerPoint(): MarkerPoint {
    return {kind: 'marker', position: [37.61, 55.75], marker: {} as Marker};
}

describe('spawn stamps', () => {
    it('stamps a marker once, so a cluster handing it back does not re-pop it', () => {
        const point = markerPoint();

        const first = spawnTimeFor(point.marker);
        registerSpawns([point]);

        expect(spawnTimeFor(point.marker)).toBe(first);
    });

    it('reports the newest stamp, which is how long the layer keeps animating', () => {
        const older = markerPoint();
        registerSpawns([older]);
        const newer = markerPoint();

        const newest = registerSpawns([older, newer]);

        expect(newest).toBe(spawnTimeFor(newer.marker));
        expect(newest).toBeGreaterThanOrEqual(spawnTimeFor(older.marker));
    });

    it('runs on the same page-relative clock the shader is given', () => {
        expect(spawnTimeFor(markerPoint().marker)).toBeLessThanOrEqual(popClock());
    });
});
