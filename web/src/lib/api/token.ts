import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import type {RefreshTokenResponseData} from '$lib/interfaces/token';
import type {Payload} from '$lib/interfaces/api';
import JsonRequest from '$lib/api/request/JsonRequest';

// I do not use this call by itself, so no need to use AuthRequest
export async function refreshToken(token: string): Promise<Payload<RefreshTokenResponseData>> {
    return new JsonRequest('/api/token/refresh', METHOD_GET).setAuthHeader(token).send();
}

export async function invalidateToken(token: string): Promise<Payload> {
    return new JsonRequest('/api/token/invalidate', METHOD_POST).setAuthHeader(token).send();
}
