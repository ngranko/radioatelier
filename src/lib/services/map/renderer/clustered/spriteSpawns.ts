import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/clustered/markerClusterIndex';

// Page-relative so the numbers stay small: the shader carries them as 32-bit floats, and
// performance.now() on a long-lived tab loses sub-millisecond precision at that width.
const epoch = performance.now();
const spawns = new WeakMap<Marker, number>();

export function popClock(): number {
    return performance.now() - epoch;
}

/** Newest stamp in `points`, so the layer knows how long to keep asking for frames. */
export function latestSpawnTime(points: MarkerPoint[]): number {
    let newest = 0;
    for (const point of points) {
        newest = Math.max(newest, spawnTimeFor(point.marker));
    }
    return newest;
}

/** First read stamps the marker; later reads keep that stamp so a cluster cannot re-pop it. */
export function spawnTimeFor(marker: Marker): number {
    const spawned = spawns.get(marker);
    if (spawned !== undefined) {
        return spawned;
    }

    const now = popClock();
    spawns.set(marker, now);
    return now;
}
