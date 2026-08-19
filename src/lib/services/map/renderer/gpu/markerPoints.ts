import type {Marker} from '$lib/services/map/marker';

export interface MarkerPoint {
    marker: Marker;
    position: [number, number];
}

export function toMarkerPoints(markers: Iterable<Marker>): MarkerPoint[] {
    const points: MarkerPoint[] = [];
    for (const marker of markers) {
        const {lat, lng} = marker.getPosition();
        points.push({marker, position: [lng, lat]});
    }
    return points;
}
