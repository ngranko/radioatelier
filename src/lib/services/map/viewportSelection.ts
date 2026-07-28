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

// Squared equirectangular distance orders markers the same way a great-circle distance
// does at viewport scale, and ordering is all this needs. Keys are computed once up
// front rather than inside the comparator, which would otherwise recompute them on
// every one of the O(n log n) comparisons.
function pickNearest(
    candidates: ViewportCandidate[],
    center: LatLngLiteral,
    limit: number,
): MarkerId[] {
    const longitudeScale = Math.cos((center.lat * Math.PI) / 180);
    const ranked = candidates.map(({id, position}) => {
        const latitudeDelta = position.lat - center.lat;
        const longitudeDelta = shortestLongitudeDelta(center.lng, position.lng) * longitudeScale;
        return {id, distance: latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta};
    });

    ranked.sort((a, b) => a.distance - b.distance);
    return ranked.slice(0, limit).map(entry => entry.id);
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
