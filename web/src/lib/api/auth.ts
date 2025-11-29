import {METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {LoginFormInputs, LoginResponsePayload} from '$lib/interfaces/auth';

export async function login(
    values: LoginFormInputs,
    options: JsonRequestOptions,
): Promise<LoginResponsePayload> {
    return new JsonRequest('/api/user/login', METHOD_POST, options).setParams(values).send();
}

export async function logout(): Promise<Payload> {
    return new AuthRequest(new JsonRequest('/api/user/logout', METHOD_POST)).send();
}
