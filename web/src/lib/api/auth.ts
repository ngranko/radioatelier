import {METHOD_POST} from '$lib/api/constants';
import type {LoginFormInputs, LoginResponsePayload} from '$lib/interfaces/auth';
import AuthRequest from '$lib/api/request/AuthRequest';
import type {Payload} from '$lib/interfaces/api';
import JsonRequest from '$lib/api/request/JsonRequest';

export async function login(values: LoginFormInputs): Promise<LoginResponsePayload> {
    return new JsonRequest('/api/user/login', METHOD_POST).setParams(values).send();
}

export async function logout(): Promise<Payload> {
    return new AuthRequest(new JsonRequest('/api/user/logout', METHOD_POST)).send();
}
