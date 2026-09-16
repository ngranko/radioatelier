import type {LatLngLiteral} from '$lib/interfaces/map';

const EARTH_RADIUS_M = 6371008.8;

export function metresBetween(from: LatLngLiteral, to: LatLngLiteral): number {
    const fromLat = toRadians(from.lat);
    const toLat = toRadians(to.lat);
    const deltaLat = toRadians(to.lat - from.lat);
    const deltaLng = toRadians(to.lng - from.lng);

    const chord =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(chord)));
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}
