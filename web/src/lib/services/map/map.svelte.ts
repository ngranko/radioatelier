import {activeObjectInfo, map} from '$lib/stores/map';
import type {MapPlaceable} from '$lib/interfaces/object';

export function getStreetView(lat: number, lng: number) {
    const streetView = new google.maps.StreetViewService();
    return streetView
        .getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        })
        .then(({data}: google.maps.StreetViewResponse) => {
            map.subscribe(value => {
                const location = data.location!;
                if (value) {
                    const pano = value.getStreetView();
                    pano.setPano(location.pano as string);
                    pano.setVisible(true);
                    activeObjectInfo.update(value => ({...value, isMinimized: true}));
                }
            });
        });
}

export function setCenter(lat: number, lng: number) {
    map.subscribe(value => {
        if (value) {
            value.setCenter(new google.maps.LatLng(lat, lng));
            value.setZoom(16);
        }
    });
}

export function setDraggable(isDraggable: boolean) {
    map.subscribe(value => {
        if (value) {
            value.set('draggable', isDraggable);
        }
    });
}

export function fitMarkerList(objects: MapPlaceable[], currentCenter?: MapPlaceable) {
    if (objects.length === 0) {
        return;
    }

    map.subscribe(value => {
        if (value) {
            const latlngbounds = new google.maps.LatLngBounds();
            if (currentCenter) {
                latlngbounds.extend(
                    new google.maps.LatLng(Number(currentCenter.lat), Number(currentCenter.lng)),
                );
            }

            for (const object of objects) {
                latlngbounds.extend(new google.maps.LatLng(Number(object.lat), Number(object.lng)));
            }
            value.fitBounds(
                latlngbounds,
                document.body.clientWidth > 640
                    ? {left: 424, top: 24, bottom: 24, right: 24}
                    : {left: 24, top: 132, bottom: 24, right: 24},
            );
        }
    });
}
