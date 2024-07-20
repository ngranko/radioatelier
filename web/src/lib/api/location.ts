import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_POST} from '$lib/api/constants';
import config from '$lib/config';
import type {GetLocationResponseData} from '$lib/interfaces/location';

export function getLocation(): Promise<GetLocationResponseData> {
    return new JsonRequest(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${config.googleMapsApiKey}`,
        METHOD_POST,
    ).send() as Promise<GetLocationResponseData>;
}
