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

const METRES_IN_KM = 1000;

/** Distance as a search result shows it: coarse enough to read at a glance. */
export function formatDistance(metres: number): string {
    if (metres < METRES_IN_KM) {
        return `${Math.round(metres / 10) * 10} м`;
    }

    const kilometres = metres / METRES_IN_KM;
    if (kilometres < 10) {
        return `${kilometres.toFixed(1).replace('.', ',')} км`;
    }

    return `${Math.round(kilometres)} км`;
}
