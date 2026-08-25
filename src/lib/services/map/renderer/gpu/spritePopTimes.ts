import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/gpu/markerPoints';

// Relative to first use so the numbers stay small: the shader carries them as 32-bit floats, and
// performance.now() on a long-lived tab loses sub-millisecond precision at that width.
let epoch: number | undefined;
const popTimes = new WeakMap<Marker, number>();

export function readPopNow(): number {
    epoch ??= performance.now();
    return performance.now() - epoch;
}

export function findLatestPop(points: MarkerPoint[]): number {
    let newest = 0;
    for (const point of points) {
        newest = Math.max(newest, readPopTime(point.marker));
    }
    return newest;
}

export function readPopTime(marker: Marker): number {
    const popped = popTimes.get(marker);
    if (popped !== undefined) {
        return popped;
    }

    const now = readPopNow();
    popTimes.set(marker, now);
    return now;
}
