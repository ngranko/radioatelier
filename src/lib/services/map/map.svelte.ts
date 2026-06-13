import type {MapPlaceable} from '$lib/interfaces/object';
import {mapState} from '$lib/state/map.svelte';

const DETAILS_OVERLAY_WIDTH = 424;
const FOCUS_ZOOM = 15;
// Below this zoom the view is too far out to tell which marker got selected,
// so only then is a forced zoom-in worth the disruption.
const FOCUS_MIN_ZOOM = 13;
const MIN_UNCOVERED_MAP_WIDTH = 400;

export function setCenter(lat: number, lng: number) {
    if (mapState.isReady) {
        mapState.provider!.setZoom(FOCUS_ZOOM);
        mapState.provider!.setCenter(lat, lng);
    }
}

export function focusDetailsTarget(lat: number, lng: number) {
    if (!mapState.isReady) {
        return;
    }

    let zoom = mapState.provider!.getZoom();
    if (zoom < FOCUS_MIN_ZOOM) {
        zoom = FOCUS_ZOOM;
        mapState.provider!.setZoom(zoom);
    }
    mapState.provider!.setCenter(lat, lng + overlayLngOffset(zoom));
}

function overlayLngOffset(zoom: number): number {
    // Shift the center west of the marker so it lands in the middle of the map
    // area not covered by the details overlay. When too little width remains
    // (mobile bottom-sheet layouts), plain centering keeps the marker visible.
    if (document.body.clientWidth - DETAILS_OVERLAY_WIDTH < MIN_UNCOVERED_MAP_WIDTH) {
        return 0;
    }

    const degreesPerPixel = 360 / (256 * 2 ** zoom);
    return -(DETAILS_OVERLAY_WIDTH / 2) * degreesPerPixel;
}

export function fitMarkerList(objects: MapPlaceable[], currentCenter?: MapPlaceable) {
    if (objects.length === 0 || !mapState.isReady) {
        return;
    }

    const bounds = mapState.provider!.createBounds();
    if (currentCenter) {
        bounds.extend({lat: currentCenter.latitude, lng: currentCenter.longitude});
    }
    for (const object of objects) {
        bounds.extend({lat: object.latitude, lng: object.longitude});
    }

    mapState.provider!.fitBounds(
        bounds,
        document.body.clientWidth > 640
            ? {left: DETAILS_OVERLAY_WIDTH, top: 24, bottom: 24, right: 24}
            : {left: 24, top: 132, bottom: 24, right: 24},
    );
}
