import config from '$lib/config';
import type {GetLocationResponseData, Location} from '$lib/interfaces/location';

export async function getInitialCenter(): Promise<Location> {
    if (localStorage.getItem('lastCenter')) {
        return JSON.parse(localStorage.getItem('lastCenter') as string);
    }

    if (localStorage.getItem('lastPosition')) {
        return JSON.parse(localStorage.getItem('lastPosition') as string);
    }

    try {
        const result = await getLocationFromGoogle();
        return result.location ?? {lat: 0, lng: 0};
    } catch (e) {
        console.error('error getting location');
        console.error(e);
    }

    return {lat: 0, lng: 0};
}

// A single watch keeps one authorization alive instead of asking for a fresh one on every poll,
// which is what makes iOS re-prompt for permissions mid-session.
export function startWatchingPosition(): number | undefined {
    if (!navigator.geolocation) {
        console.error('geolocation is unavailable, the map will run without the current position');
        return undefined;
    }

    return navigator.geolocation.watchPosition(rememberPosition, markLastPositionStale, {
        enableHighAccuracy: false,
        timeout: 5000,
    });
}

export function stopWatchingPosition(id?: number) {
    if (id !== undefined) {
        navigator.geolocation.clearWatch(id);
    }
}

async function getLocationFromGoogle(): Promise<GetLocationResponseData> {
    const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${config.googleMapsApiKey}`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        throw new Error(`Failed to get location: ${response.status}`);
    }

    return response.json();
}

function rememberPosition(position: GeolocationPosition) {
    localStorage.setItem(
        'lastPosition',
        JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            isCurrent: true,
        }),
    );
}

function markLastPositionStale(error: GeolocationPositionError) {
    console.error(error);

    const stored = localStorage.getItem('lastPosition');
    if (!stored) {
        return;
    }

    localStorage.setItem('lastPosition', JSON.stringify({...JSON.parse(stored), isCurrent: false}));
}
