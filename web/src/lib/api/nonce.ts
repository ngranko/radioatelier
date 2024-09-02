import type {Payload} from '$lib/interfaces/api';
import type {GetNonceResponsePayload} from '$lib/interfaces/nonce';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET} from '$lib/api/constants';

export async function getNonce(): Promise<Payload<GetNonceResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/nonce', METHOD_GET)).send();
}
