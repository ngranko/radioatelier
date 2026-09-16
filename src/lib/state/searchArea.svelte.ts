import type {BoundsRect, LatLngLiteral} from '$lib/interfaces/map';
import {mapState} from '$lib/state/map.svelte';
import {metresBetween} from '$lib/utils/distance';

export interface SearchViewport {
    center: LatLngLiteral;
    /** Metres from the centre to a corner, so pans and zooms are comparable in one number. */
    radius: number;
}

interface SearchArea {
    /** The area the shown results belong to. */
    searched: SearchViewport | null;
    /** The map as it last settled. */
    current: SearchViewport | null;
}

export const searchArea = $state<SearchArea>({searched: null, current: null});

// A quarter of the screen diagonal of drift is where the results on screen stop being
// the results for what is on screen.
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

// Read right away rather than on the next idle: a fit that changes nothing fires no idle,
// and the map already reports the destination camera while fitBounds and panTo animate.
export function rememberSearchedArea() {
    searchArea.searched = searchArea.current = readMapViewport();
}

export function forgetSearchedArea() {
    searchArea.searched = null;
}

export function followMapViewport() {
    searchArea.current = readMapViewport();
}

function readMapViewport(): SearchViewport | null {
    const center = mapState.provider?.getCenter();
    const bounds = mapState.provider?.getBounds()?.toRect();
    if (!center || !bounds) {
        return null;
    }

    return measureViewport(center, bounds);
}
