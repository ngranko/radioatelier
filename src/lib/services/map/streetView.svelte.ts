import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {mapState} from '$lib/state/map.svelte';
import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

let streetViewService: google.maps.StreetViewService | null = null;
const locationCache: Record<string, google.maps.StreetViewLocation> = {};

function getStreetViewService() {
    streetViewService ??= new google.maps.StreetViewService();
    return streetViewService;
}

function cacheKey(lat: number, lng: number) {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function applyStreetViewLocation(
    panorama: google.maps.StreetViewPanorama,
    location: google.maps.StreetViewLocation,
) {
    if (location.pano) {
        panorama.setPano(location.pano);
    } else if (location.latLng) {
        panorama.setPosition(location.latLng);
    } else {
        throw new Error('Invalid street view location');
    }

    panorama.setVisible(true);
}

export async function resolveStreetViewLocation(lat: number, lng: number) {
    const key = cacheKey(lat, lng);
    if (key in locationCache) {
        return locationCache[key];
    }

    const streetView = await getStreetViewService().getPanorama({
        location: new google.maps.LatLng(lat, lng),
        radius: 30,
    });
    const location = streetView.data.location!;
    locationCache[key] = location;
    return location;
}

export function getStreetView(lat: number, lng: number) {
    const provider = mapState.provider;
    if (!(provider instanceof GoogleMapsProvider)) {
        return Promise.reject(new Error('Google Maps provider not available'));
    }

    const googleMap = provider.getGoogleMap();
    if (!googleMap) {
        return Promise.reject(new Error('Map not initialized'));
    }

    return resolveStreetViewLocation(lat, lng).then(location => {
        const pano = googleMap.getStreetView();
        applyStreetViewLocation(pano, location);
        objectDetailsOverlay.isMinimized = true;
    });
}
