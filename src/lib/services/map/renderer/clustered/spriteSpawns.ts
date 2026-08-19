import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/clustered/markerClusterIndex';

// Page-relative so the numbers stay small: the shader carries them as 32-bit floats, and
// performance.now() on a long-lived tab loses sub-millisecond precision at that width.
const epoch = performance.now();
const spawns = new WeakMap<Marker, number>();

export function popClock(): number {
    return performance.now() - epoch;
}

/**
 * Stamps every marker the layer has not drawn before, and reports the newest stamp so the layer
 * knows how long to keep asking for frames. A marker keeps its first stamp for good: it pops when
 * it joins the map, not every time a cluster happens to hand it back.
 */
export function registerSpawns(points: MarkerPoint[]): number {
    let newest = 0;
    for (const point of points) {
        newest = Math.max(newest, spawnTimeFor(point.marker));
    }
    return newest;
}

export function spawnTimeFor(marker: Marker): number {
    const spawned = spawns.get(marker);
    if (spawned !== undefined) {
        return spawned;
    }

    const now = popClock();
    spawns.set(marker, now);
    return now;
}
