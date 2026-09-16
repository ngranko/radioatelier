import type {BoundsRect, LatLngLiteral} from '$lib/interfaces/map';
import {metresBetween} from '$lib/utils/distance';

export interface SearchViewport {
    center: LatLngLiteral;
    /** Metres from the centre to a corner, so pans and zooms are comparable in one number. */
    radius: number;
}

// Half a screen of drift is where the results on screen stop being the results
// for what is on screen.
const DRIFT_RATIO = 0.5;
// One zoom level roughly doubles what fits on screen; anything less is the same search.
const ZOOM_RATIO = 1.8;

export function measureViewport(center: LatLngLiteral, rect: BoundsRect): SearchViewport {
    return {center, radius: metresBetween(center, {lat: rect.north, lng: rect.east})};
}

export function shouldOfferAreaSearch(searched: SearchViewport, current: SearchViewport): boolean {
    if (metresBetween(searched.center, current.center) > current.radius * DRIFT_RATIO) {
        return true;
    }

    if (searched.radius <= 0) {
        return false;
    }

    const zoomChange = current.radius / searched.radius;
    return zoomChange > ZOOM_RATIO || zoomChange < 1 / ZOOM_RATIO;
}
