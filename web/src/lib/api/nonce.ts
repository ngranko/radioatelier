import {METHOD_GET} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {GetNonceResponsePayload} from '$lib/interfaces/nonce';

export async function getNonce(): Promise<Payload<GetNonceResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/nonce', METHOD_GET)).send();
}
