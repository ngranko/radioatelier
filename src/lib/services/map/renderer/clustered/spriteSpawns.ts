import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/clustered/markerClusterIndex';

// Relative to first use so the numbers stay small: the shader carries them as 32-bit floats, and
// performance.now() on a long-lived tab loses sub-millisecond precision at that width.
let epoch: number | undefined;
const spawns = new WeakMap<Marker, number>();

export function readPopTime(): number {
    epoch ??= performance.now();
    return performance.now() - epoch;
}

/**
 * Walking the layer's points is how the newest stamp is found. Reading a stamp also records it: a
 * marker pops when it joins the map, not every time a cluster happens to hand it back.
 */
export function findLatestSpawn(points: MarkerPoint[]): number {
    let newest = 0;
    for (const point of points) {
        newest = Math.max(newest, readSpawnTime(point.marker));
    }
    return newest;
}

export function readSpawnTime(marker: Marker): number {
    const spawned = spawns.get(marker);
    if (spawned !== undefined) {
        return spawned;
    }

    const now = readPopTime();
    spawns.set(marker, now);
    return now;
}
