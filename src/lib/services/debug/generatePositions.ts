import type {BoundsRect, LatLngLiteral} from '$lib/interfaces/map';

const EDGE_INSET = 0.08;

export function generateViewportPositions(count: number, rect: BoundsRect): LatLngLiteral[] {
    if (count <= 0) {
        return [];
    }

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const lngSpan = unwrapLngSpan(rect);
    return Array.from({length: count}, (_, index) => ({
        lat: interpolate(rect.south, rect.north - rect.south, Math.floor(index / cols), rows),
        lng: wrapLng(interpolate(rect.west, lngSpan, index % cols, cols)),
    }));
}

export function rectAround(center: LatLngLiteral, latSpan = 0.02, lngSpan = 0.03): BoundsRect {
    return {
        north: center.lat + latSpan / 2,
        south: center.lat - latSpan / 2,
        east: center.lng + lngSpan / 2,
        west: center.lng - lngSpan / 2,
    };
}

function unwrapLngSpan(rect: BoundsRect): number {
    return rect.west <= rect.east ? rect.east - rect.west : 360 - (rect.west - rect.east);
}

function interpolate(start: number, span: number, index: number, total: number): number {
    const t = total === 1 ? 0.5 : (index + 0.5) / total;
    return start + span * (EDGE_INSET + t * (1 - 2 * EDGE_INSET));
}

function wrapLng(lng: number): number {
    if (lng > 180) {
        return lng - 360;
    }
    if (lng < -180) {
        return lng + 360;
    }
    return lng;
}
