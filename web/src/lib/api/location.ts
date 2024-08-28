import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import config from '$lib/config';
import type {
    GetAddressContext,
    GetAddressResponseData,
    GetLocationResponseData,
} from '$lib/interfaces/location';
import type {QueryFunctionContext} from '@tanstack/svelte-query';
import type {Payload} from '$lib/interfaces/api';
import AuthRequest from '$lib/api/request/AuthRequest';

export function getLocation(): Promise<GetLocationResponseData> {
    return new JsonRequest(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${config.googleMapsApiKey}`,
        METHOD_POST,
    ).send();
}

export function getAddress({
    queryKey: [_key, {lat, lng}],
}: QueryFunctionContext<GetAddressContext>): Promise<Payload<GetAddressResponseData>> {
    return new AuthRequest(
        new JsonRequest(`/api/object/address?lat=${lat}&lng=${lng}`, METHOD_GET, {
            noContentType: true,
        }),
    ).send();
}
