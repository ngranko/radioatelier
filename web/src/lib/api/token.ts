import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';

// I do not use this call by itself, so no need to use AuthRequest
export async function refreshToken(options: JsonRequestOptions): Promise<Payload> {
    return new JsonRequest('/api/token/refresh', METHOD_GET, options).send();
}

export async function invalidateToken(): Promise<Payload> {
    return new JsonRequest('/api/token/invalidate', METHOD_POST).send();
}
