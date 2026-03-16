import {activeObject} from '$lib/state/activeObject.svelte.ts';
import {mapState} from '$lib/state/map.svelte';

export function getStreetView(lat: number, lng: number) {
    const streetView = new google.maps.StreetViewService();
    return streetView
        .getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        })
        .then(({data}: google.maps.StreetViewResponse) => {
            const location = data.location!;
            if (mapState.map) {
                const pano = mapState.map.getStreetView();
                pano.setPano(location.pano as string);
                pano.setVisible(true);
                activeObject.isMinimized = true;
            }
        });
}
