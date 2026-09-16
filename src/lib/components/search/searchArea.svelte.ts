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

// Called whenever the app itself moves the map for the results. fitBounds and panTo
// still animate on screen, but the map reports the destination camera as soon as they
// return, and a fit that changes nothing fires no idle, so the map is read right away
// instead of on the next idle.
export function rememberSearchedArea() {
    searchArea.searched = searchArea.current = readMapViewport();
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
