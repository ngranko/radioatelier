import type {MapPlaceable} from '$lib/interfaces/object';
import {mapState} from '$lib/state/map.svelte';

export function setCenter(lat: number, lng: number) {
    if (mapState.isReady) {
        mapState.provider.setCenter(lat, lng);
    }
}

export function setDraggable(isDraggable: boolean) {
    if (mapState.isReady) {
        mapState.provider.setDraggable(isDraggable);
    }
}

export function fitMarkerList(objects: MapPlaceable[], currentCenter?: MapPlaceable) {
    if (objects.length === 0 || !mapState.isReady) {
        return;
    }

    const bounds = mapState.provider.createBounds();
    if (currentCenter) {
        bounds.extend({lat: currentCenter.latitude, lng: currentCenter.longitude});
    }
    for (const object of objects) {
        bounds.extend({lat: object.latitude, lng: object.longitude});
    }

    mapState.provider.fitBounds(
        bounds,
        document.body.clientWidth > 640
            ? {left: 424, top: 24, bottom: 24, right: 24}
            : {left: 24, top: 132, bottom: 24, right: 24},
    );
}
