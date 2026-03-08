import config from '$lib/config';
import type {GetLocationResponseData} from '$lib/interfaces/location';

export async function getLocation(): Promise<GetLocationResponseData> {
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
