import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {mapState} from '$lib/state/map.svelte';
import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

export function getStreetView(lat: number, lng: number) {
    const provider = mapState.provider;
    if (!(provider instanceof GoogleMapsProvider)) {
        return Promise.reject(new Error('Google Maps provider not available'));
    }

    const googleMap = provider.getGoogleMap();
    if (!googleMap) {
        return Promise.reject(new Error('Map not initialized'));
    }

    const streetView = new google.maps.StreetViewService();
    return streetView
        .getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        })
        .then(({data}: google.maps.StreetViewResponse) => {
            const location = data.location!;
            const pano = googleMap.getStreetView();
            pano.setPano(location.pano as string);
            pano.setVisible(true);
            objectDetailsOverlay.isMinimized = true;
        });
}
