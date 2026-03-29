import {getGoogleProvider} from '$lib/state/map.svelte';
import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

export function getStreetView(lat: number, lng: number) {
    const provider = getGoogleProvider();
    const streetView = new google.maps.StreetViewService();
    return streetView
        .getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        })
        .then(({data}: google.maps.StreetViewResponse) => {
            const location = data.location!;
            const googleMap = provider.getGoogleMap();
            if (googleMap) {
                const pano = googleMap.getStreetView();
                pano.setPano(location.pano as string);
                pano.setVisible(true);
                objectDetailsOverlay.isMinimized = true;
            }
        });
}
