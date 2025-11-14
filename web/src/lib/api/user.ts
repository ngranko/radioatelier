import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {ChangePasswordFormInputs, MeResponseData} from '$lib/interfaces/user';

export async function changePassword(values: ChangePasswordFormInputs): Promise<Payload> {
    return new AuthRequest(
        new JsonRequest('/api/user/password', METHOD_POST).setParams(values),
    ).send();
}

export async function me(): Promise<Payload<MeResponseData>> {
    return new AuthRequest(new JsonRequest('/api/user/me', METHOD_GET)).send();
}

export async function meDirect(options: JsonRequestOptions): Promise<Payload<MeResponseData>> {
    return new AuthRequest(new JsonRequest('/api/user/me', METHOD_GET, options)).send();
}
