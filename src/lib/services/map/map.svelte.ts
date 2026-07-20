import type {MapPlaceable} from '$lib/interfaces/object';
import {mapState} from '$lib/state/map.svelte';
import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
import {DETAILS_OVERLAY_WIDTH, detailsFocusOffsets} from './detailsFocusOffset';

const FOCUS_ZOOM = 15;
// Below this zoom the view is too far out to tell which marker got selected,
// so only then is a forced zoom-in worth the disruption.
const FOCUS_MIN_ZOOM = 13;

export function focusDetailsTarget(lat: number, lng: number) {
    // Read before the ready guard so callers tracking this helper (e.g. marker
    // effects) re-run when the sheet snaps between minimized / peek / full.
    const overlayPosition = objectDetailsOverlay.position;

    if (!mapState.isReady) {
        return;
    }

    let zoom = mapState.provider!.getZoom();
    if (zoom < FOCUS_MIN_ZOOM) {
        zoom = FOCUS_ZOOM;
        mapState.provider!.setZoom(zoom);
    }

    const {latOffset, lngOffset} = detailsFocusOffsets({
        lat,
        zoom,
        viewportWidth: document.body.clientWidth,
        viewportHeight: window.innerHeight,
        overlayPosition,
    });

    mapState.provider!.setCenter(lat + latOffset, lng + lngOffset);
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
