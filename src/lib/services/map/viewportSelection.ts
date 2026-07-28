import type {BoundsRect, LatLngLiteral, MapBounds} from '$lib/interfaces/map';
import type {MarkerId} from '$lib/interfaces/marker';
import type {MarkerRepository} from '$lib/services/map/markerRepository';

interface ViewportCandidate {
    id: MarkerId;
    position: LatLngLiteral;
}

export function selectVisibleMarkerIds(
    bounds: MapBounds,
    repo: MarkerRepository,
    limit: number,
): Set<MarkerId> {
    const rect = bounds.toRect();
    const candidates: ViewportCandidate[] = [];
    const visible = new Set<MarkerId>();

    for (const [id, marker] of repo.entries()) {
        if (!marker.isViewportManaged()) {
            visible.add(id);
            continue;
        }

        const position = marker.getPosition();
        if (contains(rect, position)) {
            candidates.push({id, position});
        }
    }

    // Ranking only decides which markers to drop, so it is pure waste while the whole
    // viewport still fits under the limit — the common case at city zoom.
    if (candidates.length <= limit) {
        for (const {id} of candidates) {
            visible.add(id);
        }
        return visible;
    }

    for (const id of pickNearest(candidates, bounds.getCenter(), limit)) {
        visible.add(id);
    }
    return visible;
}

function contains(rect: BoundsRect, position: LatLngLiteral): boolean {
    if (position.lat < rect.south || position.lat > rect.north) {
        return false;
    }

    // A viewport straddling the antimeridian reports west > east, which makes the
    // longitude range wrap around instead of being a plain interval.
    return rect.west <= rect.east
        ? position.lng >= rect.west && position.lng <= rect.east
        : position.lng >= rect.west || position.lng <= rect.east;
}

// Haversine's final conversion is monotonic, so its intermediate value is an exact
// great-circle ordering key. Computing it once per marker avoids repeating the
// trigonometry in every one of the O(n log n) comparisons.
function pickNearest(
    candidates: ViewportCandidate[],
    center: LatLngLiteral,
    limit: number,
): MarkerId[] {
    const ranked = candidates.map(({id, position}) => ({
        id,
        distance: greatCircleDistanceKey(center, position),
    }));

    ranked.sort((a, b) => a.distance - b.distance);
    return ranked.slice(0, limit).map(entry => entry.id);
}

function greatCircleDistanceKey(from: LatLngLiteral, to: LatLngLiteral): number {
    const fromLatitude = toRadians(from.lat);
    const toLatitude = toRadians(to.lat);
    const latitudeDelta = toLatitude - fromLatitude;
    const longitudeDelta = toRadians(shortestLongitudeDelta(from.lng, to.lng));

    return (
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2
    );
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function shortestLongitudeDelta(from: number, to: number): number {
    let delta = to - from;
    if (delta > 180) {
        return delta - 360;
    }
    if (delta < -180) {
        return delta + 360;
    }
    return delta;
}
