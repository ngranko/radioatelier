import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import config from '$lib/config';
import type {Payload} from '$lib/interfaces/api';
import type {
    GetAddressInputs,
    GetAddressResponseData,
    GetLocationResponseData,
} from '$lib/interfaces/location';

export function getLocation(): Promise<GetLocationResponseData> {
    return new JsonRequest(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${config.googleMapsApiKey}`,
        METHOD_POST,
    ).send();
}

export function getAddress(
    {lat, lng}: GetAddressInputs,
    options: JsonRequestOptions,
): Promise<Payload<GetAddressResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/object/address?lat=${lat}&lng=${lng}`, METHOD_GET, {
            ...options,
            noContentType: true,
        }),
    ).send();
}
