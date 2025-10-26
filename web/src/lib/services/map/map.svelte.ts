import type {MapPlaceable} from '$lib/interfaces/object';
import { mapState } from '$lib/state/map.svelte';

export function setCenter(lat: number, lng: number) {
    if (mapState.map) {
        mapState.map.setCenter(new google.maps.LatLng(lat, lng));
        mapState.map.setZoom(16);
    }
}

export function setDraggable(isDraggable: boolean) {
    if (mapState.map) {
        mapState.map.set('draggable', isDraggable);
    }
}

export function fitMarkerList(objects: MapPlaceable[], currentCenter?: MapPlaceable) {
    if (objects.length === 0) {
        return;
    }

    if (mapState.map) {
        const latlngbounds = new google.maps.LatLngBounds();
        if (currentCenter) {
            latlngbounds.extend(
                new google.maps.LatLng(Number(currentCenter.lat), Number(currentCenter.lng)),
            );
        }

        for (const object of objects) {
            latlngbounds.extend(new google.maps.LatLng(Number(object.lat), Number(object.lng)));
        }
        mapState.map.fitBounds(
            latlngbounds,
            document.body.clientWidth > 640
                ? {left: 424, top: 24, bottom: 24, right: 24}
                : {left: 24, top: 132, bottom: 24, right: 24},
        );
    }
}
