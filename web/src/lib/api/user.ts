import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {
    ChangePasswordFormInputs,
    ChangePasswordResponsePayload,
    MeResponseData,
} from '$lib/interfaces/user';

export async function changePassword(
    values: ChangePasswordFormInputs,
    options: JsonRequestOptions,
): Promise<Payload<ChangePasswordResponsePayload>> {
    return new AuthRequest(
        new JsonRequest('/api/user/password', METHOD_POST, options).setParams(values),
    ).send();
}

export async function me(options: JsonRequestOptions): Promise<Payload<MeResponseData>> {
    return new AuthRequest(new JsonRequest('/api/user/me', METHOD_GET, options)).send();
}
